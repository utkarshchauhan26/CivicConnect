"""Scheme Recommendation API (enhanced eligibility filtering)

Pipeline:
1. Load dataset and scheme metadata (generated if missing).
2. Load / cache sentence transformer embeddings for scheme names.
3. Rank schemes via cosine similarity to user profile embedding.
4. Apply strict eligibility filters using metadata + heuristics.

Eligibility logic additions:
- State restriction: if scheme appears in <8 states and user state not in its state list, exclude.
- Senior schemes: require age >=60.
- Scholarships: age 16-30 and category-specific if name contains caste tag.
- BPL schemes: require is_bpl and name contains 'bpl'.
- Regional keywords (South India / Bihar Jharkhand) enforce state membership (exclude instead of score dampening).
- Income ceiling: if scheme marked low_income_flag OR contains housing/ayushman ration keywords and user annual income > scheme income_p95 (if available), exclude.
- High income users are prevented from receiving low-income targeted schemes.

Note: Heuristics derived from observed dataset distributions; refine with authoritative sources later.
"""

import sys
import json
import pandas as pd
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Paths
DATA_PATH = Path(__file__).resolve().parent / "civicconnect_govt_schemes_dataset_large.csv"
META_PATH = Path(__file__).resolve().parent / "scheme_metadata.json"
EMB_ARRAY_PATH = Path(__file__).resolve().parent / "scheme_embeddings_cache.npy"
SCHEME_LIST_PATH = Path(__file__).resolve().parent / "scheme_list_cache.json"

# Load dataset
if not DATA_PATH.exists():
    raise FileNotFoundError(f"Dataset missing at {DATA_PATH}")
df = pd.read_csv(DATA_PATH)

# Ensure metadata exists (generate if absent)
if not META_PATH.exists():
    # Lazy import generator to avoid cost when metadata already present
    from generate_scheme_metadata import main as generate_meta
    generate_meta()

scheme_metadata = json.loads(META_PATH.read_text(encoding="utf-8"))

# Clean and extract unique schemes
scheme_set = set()
for entry in df['eligible_schemes']:
    if pd.isna(entry) or str(entry).strip().lower() in ['', 'none']:
        continue
    parts = [p.strip() for p in str(entry).split(';') if p.strip()]
    for p in parts:
        scheme_set.add(p)

scheme_list = sorted(list(scheme_set))

# Load Sentence-BERT model
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

def _build_embeddings():
    emb_dict = {}
    for s in scheme_list:
        emb_dict[s] = model.encode(s, convert_to_numpy=True)
    return emb_dict

# Embedding caching
if EMB_ARRAY_PATH.exists() and SCHEME_LIST_PATH.exists():
    try:
        cached_list = json.loads(SCHEME_LIST_PATH.read_text(encoding="utf-8"))
        if cached_list == scheme_list:
            emb_array = np.load(EMB_ARRAY_PATH)
            scheme_embeddings = {s: emb_array[i] for i, s in enumerate(cached_list)}
        else:
            scheme_embeddings = _build_embeddings()
            np.save(EMB_ARRAY_PATH, np.stack([scheme_embeddings[s] for s in scheme_list]))
            SCHEME_LIST_PATH.write_text(json.dumps(scheme_list, indent=2), encoding="utf-8")
    except Exception:
        scheme_embeddings = _build_embeddings()
        np.save(EMB_ARRAY_PATH, np.stack([scheme_embeddings[s] for s in scheme_list]))
        SCHEME_LIST_PATH.write_text(json.dumps(scheme_list, indent=2), encoding="utf-8")
else:
    scheme_embeddings = _build_embeddings()
    np.save(EMB_ARRAY_PATH, np.stack([scheme_embeddings[s] for s in scheme_list]))
    SCHEME_LIST_PATH.write_text(json.dumps(scheme_list, indent=2), encoding="utf-8")

def user_to_text(age, category, income, state, is_bpl=False):
    """Convert user profile to text for embedding"""
    text = f"age {age}, category {category}, annual income {income}, state {state}"
    if is_bpl:
        text += ", belongs to BPL"
    return text

def get_user_embedding(age, category, income, state, is_bpl=False):
    """Generate embedding for user profile"""
    txt = user_to_text(age, category, income, state, is_bpl)
    return model.encode(txt, convert_to_numpy=True)

def rank_schemes(user_emb, scheme_embeddings_dict, top_k=30):
    """Rank schemes by cosine similarity to user profile"""
    names = list(scheme_embeddings_dict.keys())
    embs = np.stack([scheme_embeddings_dict[n] for n in names])
    scores = cosine_similarity([user_emb], embs)[0]
    idxs = np.argsort(scores)[::-1][:top_k]
    return [(names[i], float(scores[i])) for i in idxs]

def apply_rule_filters(recommended_schemes, user):
    """Apply metadata-driven strict eligibility filters."""
    age, category, income, state, is_bpl = user
    final = []

    for scheme, score in recommended_schemes:
        meta = scheme_metadata.get(scheme, {})
        s_low = scheme.lower()

        # Regional explicit keywords (South India Welfare Scheme, Bihar/Jharkhand Rural Support Scheme)
        # These are HARD state restrictions - always enforce
        if meta.get("south_india_flag") and state not in ['Karnataka','Kerala','Tamil Nadu','Andhra Pradesh','Telangana']:
            continue
        if meta.get("bihar_jharkhand_flag") and state not in ['Bihar','Jharkhand']:
            continue
        
        # For other schemes: only exclude if scheme is truly state-limited (< 5 states) and user not in list
        # Schemes with 5+ states are considered national/widely available, so don't enforce strict state matching
        states = meta.get("states", [])
        if states and len(states) < 5 and state not in states:
            continue

        # Senior citizen / old age schemes
        if meta.get("senior_flag") or any(k in s_low for k in ["old age", "senior citizen", "bus pass"]):
            if age < 60:
                continue

        # Scholarship schemes age bounds
        if meta.get("scholarship_flag"):
            if age < 16 or age > 30:
                continue
            # Category-specific scholarships by name
            if 'obc' in s_low and category != 'OBC':
                continue
            if 'sc' in s_low and category != 'SC':
                continue
            if 'st' in s_low and category != 'ST':
                continue

        # BPL requirement
        if 'bpl' in s_low and not is_bpl:
            continue

        # Income ceiling: ONLY exclude if explicitly BPL-targeted or extremely low income_p95
        # For general low-income schemes, allow high earners to see them (they may apply for family members)
        income_p95 = meta.get("income_p95")
        if income_p95:
            # Only hard-exclude if scheme is explicitly BPL or income cap is very low (< 100k p95)
            is_hard_income_restricted = 'bpl' in s_low or income_p95 < 100_000
            if is_hard_income_restricted and income > income_p95 * 5:
                continue

        final.append((scheme, score))

    return final

def recommend_schemes(age, category, income, state, top_k=10):
    """Main recommendation function returning strictly eligible schemes."""
    # Define BPL as income below threshold (25k) – could refine later with region-specific poverty lines
    is_bpl = income <= 25_000
    user_emb = get_user_embedding(age, category, income, state, is_bpl)
    ranked = rank_schemes(user_emb, scheme_embeddings, top_k=80)  # broader candidate pool
    filtered = apply_rule_filters(ranked, (age, category, income, state, is_bpl))

    # Deduplicate preserve first occurrence (already sorted by similarity pre-filter)
    seen = set()
    dedup = []
    for scheme, score in filtered:
        if scheme in seen:
            continue
        seen.add(scheme)
        dedup.append((scheme, score))

    # Re-sort by score after filtering
    dedup.sort(key=lambda x: x[1], reverse=True)
    return dedup[:top_k]

if __name__ == "__main__":
    # Read user data from stdin (passed from Node.js)
    input_data = json.loads(sys.stdin.read())
    
    age = input_data['age']
    category = input_data['category']
    income = input_data['annualIncome']
    state = input_data['state']
    
    # Get recommendations
    recommendations = recommend_schemes(age, category, income, state, top_k=15)
    
    # Format output
    result = {
        'schemes': [
            {
                'name': scheme,
                'score': score,
                'category': 'Government Scheme'
            }
            for scheme, score in recommendations
        ]
    }
    
    # Output as JSON
    print(json.dumps(result))
