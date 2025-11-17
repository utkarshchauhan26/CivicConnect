import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import pickle
import re
import os

# ------------------------------
# 1. FIXED PATHS (IMPORTANT)
# ------------------------------

# Get project root (one level up from src)
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))

DATA_PATH = os.path.join(PROJECT_ROOT, "data", "civicconnect_dataset.csv")
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "complaint_classifier.pkl")

print("Using dataset from:", DATA_PATH)
print("Saving model to:", MODEL_PATH)

# 2. Load dataset
df = pd.read_csv(DATA_PATH)

print("Shape of dataset:", df.shape)
print("Columns:", df.columns.tolist())
print(df.head(3))


# 3. Basic cleaning
df = df.dropna(subset=["complaint_text", "issue_type"])
df["issue_type"] = df["issue_type"].astype(str).str.strip()


# 4. Text preprocessing
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


df["cleaned_text"] = df["complaint_text"].apply(clean_text)


# 5. Features and labels
X_text = df["cleaned_text"]
y_labels = df["issue_type"]

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y_labels)

print("Unique issue_type classes:", label_encoder.classes_)


# 6. Split dataset
X_train_text, X_test_text, y_train, y_test = train_test_split(
    X_text,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# 7. TF-IDF vectorization
vectorizer = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),
    stop_words="english"
)

X_train = vectorizer.fit_transform(X_train_text)
X_test = vectorizer.transform(X_test_text)


# 8. Train classifier
clf = LogisticRegression(max_iter=1000, n_jobs=-1)
clf.fit(X_train, y_train)


# 9. Evaluate
y_pred = clf.predict(X_test)

print("\nTest Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))


# 10. Save trained components
MODEL_BUNDLE = {
    "vectorizer": vectorizer,
    "classifier": clf,
    "label_encoder": label_encoder
}

with open(MODEL_PATH, "wb") as f:
    pickle.dump(MODEL_BUNDLE, f)

print("\nModel saved successfully at:", MODEL_PATH)


# 11. Prediction helper
def predict_issue_type(example_texts):
    cleaned = [clean_text(t) for t in example_texts]
    X_vec = vectorizer.transform(cleaned)
    preds = clf.predict(X_vec)
    labels = label_encoder.inverse_transform(preds)
    return labels


# 12. Manual test
if __name__ == "__main__":
    sample_complaints = [
        "There is intense water logging in the streets after the rains.",
        "I went to the court but the lawyer is asking for bribes.",
        "I filed a complaint for harassment but no action has been taken.",
        "There is illegal gathering in our residential premises."
    ]

    predicted = predict_issue_type(sample_complaints)
    for text, label in zip(sample_complaints, predicted):
        print(f"\nComplaint: {text}\nPredicted Issue Type: {label}")
