# Converted from CivicConnect_Recommendation_Engine.ipynb

# Install required packages if not present (uncomment to run in a fresh env)

# !pip install sentence-transformers pandas numpy scikit-learn

print('Skip install cell if packages already available.')


import pandas as pd

import numpy as np

import os

from pathlib import Path

print('imports ok')


# Step 1: Load dataset

DATA_PATH = r"D:\CivicConnect\backend\civicconnect_govt_schemes_dataset_large.csv"

if not Path(DATA_PATH).exists():

    raise FileNotFoundError(f"Dataset not found at {DATA_PATH}. Please place the CSV at this path.")

df = pd.read_csv(DATA_PATH)

print('Loaded dataset shape:', df.shape)

df.head(3)


# Step 2: Clean eligible_schemes column and extract unique schemes

import pandas as pd

scheme_set = set()

cleaned = []

for entry in df['eligible_schemes']:

    if pd.isna(entry):

        cleaned.append('None')

        continue

    s = str(entry)

    s = s.strip()

    if s == '' or s.lower() == 'none':

        cleaned.append('None')

        continue

    parts = [p.strip() for p in s.split(';') if p.strip()]

    if not parts:

        cleaned.append('None')

        continue

    cleaned.append(';'.join(parts))

    for p in parts:

        scheme_set.add(p)



df['eligible_schemes_clean'] = cleaned

scheme_list = sorted(list(scheme_set))

print('Unique schemes found:', len(scheme_list))

scheme_list[:40]


# Step 3: Load Sentence-BERT model and create scheme embeddings

from sentence_transformers import SentenceTransformer

model_name = 'paraphrase-MiniLM-L6-v2'

print('Loading model:', model_name)

model = SentenceTransformer(model_name)

print('Model loaded.')



# Create embeddings for scheme names (you can extend to full descriptions later)

scheme_embeddings = {}

for scheme in scheme_list:

    emb = model.encode(scheme, convert_to_numpy=True)

    scheme_embeddings[scheme] = emb

print('Created embeddings for all schemes.')



# Save embeddings and list

out_dir = Path('/mnt/data/civicconnect_artifacts')

out_dir.mkdir(parents=True, exist_ok=True)

np.save(out_dir / 'scheme_embeddings_array.npy', np.stack(list(scheme_embeddings.values())))

with open(out_dir / 'scheme_list.json', 'w', encoding='utf-8') as f:

    import json

    json.dump(scheme_list, f, ensure_ascii=False, indent=2)

print('Saved embeddings and scheme list to', out_dir)



# Create a mapping from scheme to index for the saved array

scheme_to_idx = {scheme:i for i, scheme in enumerate(scheme_list)}

with open(out_dir / 'scheme_to_idx.json', 'w', encoding='utf-8') as f:

    import json

    json.dump(scheme_to_idx, f, ensure_ascii=False, indent=2)

print('Saved scheme_to_idx.json')


# Helper: build user text and embedding

def user_to_text(age, category, income, state, is_bpl=False):

    text = f"age {age}, category {category}, annual income {income}, state {state}"

    if is_bpl:

        text += ", belongs to BPL"

    return text



def get_user_embedding(age, category, income, state, is_bpl=False):

    txt = user_to_text(age, category, income, state, is_bpl)

    return model.encode(txt, convert_to_numpy=True)



from sklearn.metrics.pairwise import cosine_similarity

def rank_schemes(user_emb, scheme_embeddings_dict, top_k=15):

    names = list(scheme_embeddings_dict.keys())

    embs = np.stack([scheme_embeddings_dict[n] for n in names])

    scores = cosine_similarity([user_emb], embs)[0]

    idxs = np.argsort(scores)[::-1][:top_k]

    return [(names[i], float(scores[i])) for i in idxs]



print('Helper functions ready')


# Improved rule-based filters (Fix 1, Fix 2, Fix 3 integrated)

def apply_rule_filters(recommended_schemes, user):

    age, category, income, state, is_bpl = user

    final = []

    for scheme, score in recommended_schemes:

        s_low = scheme.lower()

        # Fix 1: Category-based scholarship filtering

        if 'scholarship' in s_low:

            # If scholarship name contains caste filter, check

            if 'obc' in s_low and category != 'OBC':

                continue

            if 'sc' in s_low and category != 'SC':

                continue

            if 'st' in s_low and category != 'ST':

                continue

        # Fix 2: State-based filtering (simple heuristics)

        if 'south india' in s_low:

            if state not in ['Karnataka','Kerala','Tamil Nadu','Andhra Pradesh','Telangana']:

                continue

        if 'bihar' in s_low or 'jharkhand' in s_low:

            if state not in ['Bihar','Jharkhand']:

                continue

        # Fix 3: BPL filtering

        if 'bpl' in s_low and not is_bpl:

            continue

        # Age constraints: if scheme name mentions senior/old age

        if any(k in s_low for k in ['old age','senior','senior citizen']):

            if age < 60:

                continue

        # Scholarship age limit heuristic

        if 'scholarship' in s_low:

            if age > 30:

                continue

        final.append((scheme, score))

    return final



print('apply_rule_filters defined')


# Full recommendation function

def recommend_schemes(age, category, income, state, top_k=10):

    is_bpl = income <= 25000

    user_emb = get_user_embedding(age, category, income, state, is_bpl)

    ranked = rank_schemes(user_emb, scheme_embeddings, top_k=30)

    filtered = apply_rule_filters(ranked, (age, category, income, state, is_bpl))

    return filtered[:top_k]



print('recommend_schemes ready')


# Test the recommender

test_user = dict(age=23, category='OBC', income=60000, state='Bihar')

res = recommend_schemes(test_user['age'], test_user['category'], test_user['income'], test_user['state'])

print('Recommended Schemes:')

for scheme, score in res:

    print(f"{scheme}  (score: {score:.3f})")



# Save final artifacts (scheme embeddings array and mapping already saved)

print('Artifacts saved in', out_dir)

print('Notebook complete. You can integrate recommend_schemes(...) into your API/backend.')

