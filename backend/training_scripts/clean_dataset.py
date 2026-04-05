"""
Step 2: Clean, deduplicate, and split the dataset into train/val
Run this AFTER generate_seed_dataset.py AND after you add manually curated rows.
"""
import pandas as pd
import os, re

BASE_DIR   = os.path.join(os.path.dirname(__file__), "..", "dataset")
SEED_FILE  = os.path.join(BASE_DIR, "flan_t5_seed.csv")
CURATED    = os.path.join(BASE_DIR, "flan_t5_curated.csv")   # your manual rows (may not exist yet)
TRAIN_OUT  = os.path.join(BASE_DIR, "flan_t5_train.csv")
VAL_OUT    = os.path.join(BASE_DIR, "flan_t5_val.csv")

# ─── Load all sources ────────────────────────────────────────
frames = []
if os.path.exists(SEED_FILE):
    frames.append(pd.read_csv(SEED_FILE))
    print(f"  Seed rows loaded:    {len(frames[-1])}")

if os.path.exists(CURATED):
    frames.append(pd.read_csv(CURATED))
    print(f"  Curated rows loaded: {len(frames[-1])}")
else:
    print("  ⚠ No curated file found yet — only using seed data.")

df = pd.concat(frames, ignore_index=True)
print(f"\nTotal before cleaning: {len(df)}")

# ─── Quality Filters ─────────────────────────────────────────
def passes_qc(row):
    q = str(row.get("output_question", "")).strip()

    # 1. Must end with ?
    if not q.endswith("?"):
        return False

    # 2. Word count between 8 and 80
    words = q.split()
    if len(words) < 8 or len(words) > 80:
        return False

    # 3. Must not be just a template variable that wasn't filled
    if "{" in q or "}" in q:
        return False

    # 4. Input prompt must exist and be non-empty
    inp = str(row.get("input_prompt", "")).strip()
    if len(inp) < 10:
        return False

    # 5. Required columns must be present
    for col in ["role", "skill", "difficulty", "question_type"]:
        if pd.isna(row.get(col, None)) or str(row.get(col, "")).strip() == "":
            return False

    return True

df["pass_qc"] = df.apply(passes_qc, axis=1)
failed = (~df["pass_qc"]).sum()
df = df[df["pass_qc"]].drop(columns=["pass_qc"])
print(f"Removed {failed} rows that failed QC")

# ─── Deduplication ───────────────────────────────────────────
before_dedup = len(df)
# Normalise before dedup: lowercase, strip punctuation
df["_norm"] = df["output_question"].str.lower().str.strip().str.replace(r"[^\w\s]", "", regex=True)
df.drop_duplicates(subset=["_norm"], inplace=True)
df.drop(columns=["_norm"], inplace=True)
print(f"Removed {before_dedup - len(df)} duplicate questions")

# ─── Balance Check ───────────────────────────────────────────
print("\n── Distribution ────────────────────────────────")
print("By difficulty:\n", df["difficulty"].value_counts().to_string())
print("\nBy question_type:\n", df["question_type"].value_counts().to_string())
print("\nBy role:\n", df["role"].value_counts().to_string())

# ─── Rebuild input_prompt if missing ────────────────────────
# Ensures consistent format even for manually added rows
def rebuild_prompt(row):
    p = str(row.get("input_prompt", "")).strip()
    if len(p) > 10:
        return p
    return f"Generate a {row['difficulty']} {row['question_type']} question for a {row['role']} focusing on {row['skill']}"

df["input_prompt"] = df.apply(rebuild_prompt, axis=1)

# ─── Train / Val Split (90/10) ───────────────────────────────
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
split = int(len(df) * 0.9)
df_train = df.iloc[:split]
df_val   = df.iloc[split:]

df_train.to_csv(TRAIN_OUT, index=False)
df_val.to_csv(VAL_OUT,   index=False)

print(f"\n✅ Train: {len(df_train)} rows → {TRAIN_OUT}")
print(f"✅ Val:   {len(df_val)} rows → {VAL_OUT}")
print(f"Total clean rows: {len(df)}")
