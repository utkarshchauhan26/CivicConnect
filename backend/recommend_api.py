"""
Scheme Recommendation API - Production Ready
Uses Sentence-BERT to recommend government schemes based on user profile
"""

import sys
import json
import pandas as pd
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load dataset
DATA_PATH = Path(__file__).parent / "civicconnect_govt_schemes_dataset_large.csv"
df = pd.read_csv(DATA_PATH)

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

# Create embeddings for all schemes
scheme_embeddings = {}
for scheme in scheme_list:
    emb = model.encode(scheme, convert_to_numpy=True)
    scheme_embeddings[scheme] = emb

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
    """Apply rule-based filters for eligibility"""
    age, category, income, state, is_bpl = user
    final = []
    
    for scheme, score in recommended_schemes:
        s_low = scheme.lower()
        skip = False
        
        # ===== STRICT AGE FILTERS (MUST EXCLUDE) =====
        
        # Old age schemes - 60+ only
        if any(k in s_low for k in ['old age', 'senior citizen']):
            if age < 60:
                skip = True
                continue
        
        # Senior bus pass - 60+ only  
        if 'bus pass' in s_low and 'senior' in s_low:
            if age < 60:
                skip = True
                continue
        
        # Scholarship age limits - 16 to 30 only
        if 'scholarship' in s_low:
            if age < 16 or age > 30:
                skip = True
                continue
        
        # ===== STRICT CATEGORY FILTERS (MUST EXCLUDE) =====
        
        # Category-specific scholarships
        if 'scholarship' in s_low:
            if 'obc' in s_low and category != 'OBC':
                skip = True
                continue
            elif 'sc' in s_low and category != 'SC':
                skip = True
                continue
            elif 'st' in s_low and category != 'ST':
                skip = True
                continue
        
        # ===== STRICT BPL FILTERS =====
        
        # BPL ration card - only for BPL families
        if 'bpl' in s_low and 'ration' in s_low:
            if not is_bpl:
                skip = True
                continue
        
        # ===== SOFT STATE FILTERS (SCORE ADJUSTMENT) =====
        
        # Regional schemes - adjust score but don't exclude
        if 'south india' in s_low:
            if state not in ['Karnataka', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana']:
                score *= 0.5  # Reduce score for non-matching states
        
        if 'bihar' in s_low or 'jharkhand' in s_low:
            if state not in ['Bihar', 'Jharkhand']:
                score *= 0.5  # Reduce score for non-matching states
        
        if not skip:
            final.append((scheme, score))
    
    return final

def recommend_schemes(age, category, income, state, top_k=10):
    """Main recommendation function"""
    is_bpl = income <= 25000
    user_emb = get_user_embedding(age, category, income, state, is_bpl)
    ranked = rank_schemes(user_emb, scheme_embeddings, top_k=50)  # Get more candidates
    filtered = apply_rule_filters(ranked, (age, category, income, state, is_bpl))
    
    # Remove duplicates while preserving order and keeping highest score
    seen = set()
    unique_filtered = []
    for scheme, score in filtered:
        if scheme not in seen:
            seen.add(scheme)
            unique_filtered.append((scheme, score))
    
    # Sort by score descending
    unique_filtered.sort(key=lambda x: x[1], reverse=True)
    
    # Return what we have - if we don't have enough schemes, that's better than showing irrelevant ones
    return unique_filtered[:top_k]

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
