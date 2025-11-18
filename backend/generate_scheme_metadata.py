"""Generate scheme metadata from dataset.
Creates scheme_metadata.json with per-scheme aggregated attributes:
- states: list of states where scheme appears
- age_min, age_max: observed age range
- income_min, income_max: observed income range
- income_p90, income_p95: upper income percentiles for eligibility heuristics
- categories: list of beneficiary categories observed (SC, ST, OBC, General, General(EWS), etc.)
- bpl_count / total_count: counts to infer if scheme is predominantly BPL targeted
Heuristics applied later in recommender:
- State restricted if scheme appears in < 8 states AND user state not in states
- Age restriction enforced for senior citizen / old age schemes (>=60) and scholarships (16-30)
- BPL required if name contains 'bpl' and bpl_count / total_count > 0.3
- Income must be <= income_p95 (slight tolerance) for low-income schemes; extremely high income users filtered out.
"""
from __future__ import annotations
import json
from pathlib import Path
from collections import defaultdict
import pandas as pd
import numpy as np

DATA_PATH = Path(__file__).resolve().parent / "civicconnect_govt_schemes_dataset_large.csv"
OUTPUT_PATH = Path(__file__).resolve().parent / "scheme_metadata.json"

RESERVED_LOW_INCOME_KEYWORDS = ["ayushman", "bpl", "ration", "housing", "pmay"]
SENIOR_KEYWORDS = ["old age", "senior", "senior citizen", "bus pass"]
SCHOLARSHIP_KEYWORD = "scholarship"
SOUTH_INDIA_KEYWORD = "south india"
BIHAR_JHARKHAND_KEYWORDS = ["bihar", "jharkhand"]

def build_metadata(df: pd.DataFrame):
    meta = {}
    grouped = defaultdict(list)

    for _, row in df.iterrows():
        schemes_raw = row.get("eligible_schemes", "")
        if pd.isna(schemes_raw) or str(schemes_raw).strip().lower() in ["", "none"]:
            continue
        schemes = [s.strip() for s in str(schemes_raw).split(";") if s.strip()]
        for scheme in schemes:
            grouped[scheme].append(row)

    for scheme, rows in grouped.items():
        ages = [int(r["age"]) for r in rows if not pd.isna(r["age"])]
        incomes = [int(r["annual_income"]) for r in rows if not pd.isna(r["annual_income"])]
        categories = {str(r["category"]).strip() for r in rows if not pd.isna(r["category"])}
        states = {str(r["state"]).strip() for r in rows if not pd.isna(r["state"])}
        bpl_flags = [bool(r["is_bpl"]) if not pd.isna(r["is_bpl"]) else False for r in rows]

        age_min = int(min(ages)) if ages else None
        age_max = int(max(ages)) if ages else None
        income_min = int(min(incomes)) if incomes else None
        income_max = int(max(incomes)) if incomes else None
        income_p90 = int(np.percentile(incomes, 90)) if incomes else None
        income_p95 = int(np.percentile(incomes, 95)) if incomes else None

        name_lower = scheme.lower()
        low_income_flag = any(k in name_lower for k in RESERVED_LOW_INCOME_KEYWORDS)
        senior_flag = any(k in name_lower for k in SENIOR_KEYWORDS)
        scholarship_flag = SCHOLARSHIP_KEYWORD in name_lower
        south_india_flag = SOUTH_INDIA_KEYWORD in name_lower
        bihar_jharkhand_flag = any(k in name_lower for k in BIHAR_JHARKHAND_KEYWORDS)

        meta[scheme] = {
            "states": sorted(states),
            "age_min": age_min,
            "age_max": age_max,
            "income_min": income_min,
            "income_max": income_max,
            "income_p90": income_p90,
            "income_p95": income_p95,
            "categories": sorted(categories),
            "bpl_count": sum(bpl_flags),
            "total_count": len(rows),
            "low_income_flag": low_income_flag,
            "senior_flag": senior_flag,
            "scholarship_flag": scholarship_flag,
            "south_india_flag": south_india_flag,
            "bihar_jharkhand_flag": bihar_jharkhand_flag,
        }

    return meta


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    meta = build_metadata(df)
    OUTPUT_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"Wrote metadata for {len(meta)} schemes to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
