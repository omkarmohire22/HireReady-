"""
Step 4: Test your trained FLAN-T5 model.
Run this after train_flan_t5.py completes.

Usage:
    python training_scripts/test_model.py
"""
import os, torch
from transformers import T5ForConditionalGeneration, T5Tokenizer

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_models", "question_generator", "best")

print(f"📦 Loading trained model from {MODEL_DIR}")
tokenizer = T5Tokenizer.from_pretrained(MODEL_DIR)
model     = T5ForConditionalGeneration.from_pretrained(MODEL_DIR)
model.eval()

# ─── Generation config ──────────────────────────────────────
GEN_CONFIG = dict(
    max_length           = 100,
    num_beams            = 5,
    num_return_sequences = 3,
    no_repeat_ngram_size = 2,
    early_stopping       = True,
    temperature          = 0.8,
)

# ─── Quality filter for output ──────────────────────────────
def quality_check(q: str, skill: str) -> tuple[bool, str]:
    q = q.strip()
    if not q.endswith("?"):
        return False, "Does not end with ?"
    if len(q.split()) < 8:
        return False, "Too short (< 8 words)"
    if len(q.split()) > 80:
        return False, "Too long (> 80 words)"
    if "{" in q:
        return False, "Unfilled template variable"
    return True, "✅ Pass"

def generate_questions(role: str, skill: str, difficulty: str, qtype: str):
    prompt = f"Generate a {difficulty} {qtype} question for a {role} focusing on {skill}"
    inputs = tokenizer(prompt, return_tensors="pt", max_length=64, truncation=True)

    with torch.no_grad():
        outputs = model.generate(**inputs, **GEN_CONFIG)

    questions = [tokenizer.decode(o, skip_special_tokens=True) for o in outputs]
    return prompt, questions


# ─── Test cases ─────────────────────────────────────────────
TEST_CASES = [
    ("Backend Developer",  "Docker",           "Hard",   "Design"),
    ("Frontend Developer", "React",            "Medium", "Scenario"),
    ("Data Analyst",       "Python",           "Easy",   "Conceptual"),
    ("DevOps Engineer",    "Kubernetes",       "Hard",   "Debugging"),
    ("ML Engineer",        "Feature Engineering", "Medium", "Conceptual"),
    ("Backend Developer",  "Redis",            "Medium", "Design"),
    ("Full Stack Developer","MongoDB",         "Easy",   "Conceptual"),
    ("Frontend Developer", "TypeScript",       "Hard",   "Behavioural"),
]

print("\n" + "="*70)
print("FLAN-T5 TEST RESULTS")
print("="*70)

pass_count  = 0
total_count = 0

for role, skill, difficulty, qtype in TEST_CASES:
    prompt, candidates = generate_questions(role, skill, difficulty, qtype)
    print(f"\n📝 PROMPT: {prompt}")

    best = None
    for i, q in enumerate(candidates):
        ok, reason = quality_check(q, skill)
        status = "✅" if ok else "❌"
        print(f"   [{i+1}] {status} {q}")
        if ok and best is None:
            best = q

    total_count += 1
    if best:
        pass_count += 1
        print(f"   → Selected: \"{best}\"")
    else:
        print(f"   → ⚠ All candidates failed QC — fallback to dataset retrieval")

print("\n" + "="*70)
print(f"PASS RATE: {pass_count}/{total_count} ({100*pass_count//total_count}%)")
print("="*70)

if pass_count < total_count * 0.7:
    print("\n⚠  Less than 70% passing — recommended actions:")
    print("   1. Add more manually curated rows to the dataset")
    print("   2. Train for 2-3 more epochs")
    print("   3. Check that output_question column is clean in your CSVs")
else:
    print("\n🎉 Model is performing well and ready for FastAPI integration!")
