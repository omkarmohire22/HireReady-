"""
Step 3: Fine-tune FLAN-T5 on your interview question dataset.

Usage:
    python training_scripts/train_flan_t5.py

Requirements already in requirements.txt:
    transformers, torch, pandas

Tip: On CPU this takes ~2-4 hours for 5 epochs on 2000 rows.
     On GPU (Colab/local NVIDIA) it takes ~15-20 minutes.
"""
import os, time, pandas as pd, torch
from torch.utils.data import Dataset, DataLoader
from transformers import T5ForConditionalGeneration, T5Tokenizer

# ─── CONFIG (change these) ────────────────────────────────────
MODEL_NAME  = "google/flan-t5-small"   # or "google/flan-t5-base" if RAM allows
TRAIN_CSV   = os.path.join(os.path.dirname(__file__), "..", "dataset", "flan_t5_train.csv")
VAL_CSV     = os.path.join(os.path.dirname(__file__), "..", "dataset", "flan_t5_val.csv")
SAVE_DIR    = os.path.join(os.path.dirname(__file__), "..", "ml_models", "question_generator")

EPOCHS      = 5
BATCH_SIZE  = 8       # reduce to 4 if you get OOM errors
LR          = 3e-4
MAX_IN_LEN  = 64      # input prompt is short — no need for 128
MAX_OUT_LEN = 96      # questions are 8–70 words
SAVE_EVERY  = 1       # save checkpoint every N epochs
# ─────────────────────────────────────────────────────────────

os.makedirs(SAVE_DIR, exist_ok=True)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"📦 Device: {device}")
print(f"📦 Loading model: {MODEL_NAME}")

tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
model     = T5ForConditionalGeneration.from_pretrained(MODEL_NAME)
model.to(device)


# ─── Dataset class ───────────────────────────────────────────
class QuestionDataset(Dataset):
    def __init__(self, csv_path):
        self.data = pd.read_csv(csv_path).dropna(subset=["input_prompt", "output_question"])
        print(f"  Loaded {len(self.data)} rows from {os.path.basename(csv_path)}")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row   = self.data.iloc[idx]
        inp   = str(row["input_prompt"]).strip()
        out   = str(row["output_question"]).strip()

        enc = tokenizer(
            inp,
            max_length=MAX_IN_LEN,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        dec = tokenizer(
            out,
            max_length=MAX_OUT_LEN,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        labels = dec["input_ids"].squeeze().clone()
        # Replace padding token id with -100 so loss ignores them
        labels[labels == tokenizer.pad_token_id] = -100

        return {
            "input_ids":      enc["input_ids"].squeeze(),
            "attention_mask": enc["attention_mask"].squeeze(),
            "labels":         labels,
        }


# ─── Load data ───────────────────────────────────────────────
print("\n📂 Loading datasets...")
train_ds = QuestionDataset(TRAIN_CSV)
val_ds   = QuestionDataset(VAL_CSV)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

optimizer = torch.optim.AdamW(model.parameters(), lr=LR)

# Cosine LR scheduler — keeps training stable across epochs
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

# ─── Training loop ───────────────────────────────────────────
print(f"\n🚀 Starting training — {EPOCHS} epochs, batch size {BATCH_SIZE}\n")
best_val_loss = float("inf")

for epoch in range(1, EPOCHS + 1):
    t0 = time.time()

    # ── Train ──
    model.train()
    train_loss = 0.0
    for step, batch in enumerate(train_loader):
        optimizer.zero_grad()
        out = model(
            input_ids      = batch["input_ids"].to(device),
            attention_mask = batch["attention_mask"].to(device),
            labels         = batch["labels"].to(device),
        )
        loss = out.loss
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)   # prevents exploding gradients
        optimizer.step()
        train_loss += loss.item()

        if (step + 1) % 50 == 0:
            avg = train_loss / (step + 1)
            print(f"  Epoch {epoch} | Step {step+1}/{len(train_loader)} | Loss: {avg:.4f}")

    scheduler.step()
    avg_train = train_loss / len(train_loader)

    # ── Validate ──
    model.eval()
    val_loss = 0.0
    with torch.no_grad():
        for batch in val_loader:
            out = model(
                input_ids      = batch["input_ids"].to(device),
                attention_mask = batch["attention_mask"].to(device),
                labels         = batch["labels"].to(device),
            )
            val_loss += out.loss.item()
    avg_val = val_loss / len(val_loader)

    elapsed = time.time() - t0
    print(f"\n✅ Epoch {epoch}/{EPOCHS} | Train Loss: {avg_train:.4f} | Val Loss: {avg_val:.4f} | Time: {elapsed:.0f}s")

    # ── Save checkpoint ──
    if epoch % SAVE_EVERY == 0:
        ckpt_dir = os.path.join(SAVE_DIR, f"checkpoint_epoch{epoch}")
        model.save_pretrained(ckpt_dir)
        tokenizer.save_pretrained(ckpt_dir)
        print(f"   💾 Checkpoint saved → {ckpt_dir}")

    # ── Save best model ──
    if avg_val < best_val_loss:
        best_val_loss = avg_val
        model.save_pretrained(os.path.join(SAVE_DIR, "best"))
        tokenizer.save_pretrained(os.path.join(SAVE_DIR, "best"))
        print(f"   ⭐ New best model saved (val loss {best_val_loss:.4f})")

# ─── Final save ──────────────────────────────────────────────
model.save_pretrained(SAVE_DIR)
tokenizer.save_pretrained(SAVE_DIR)
print(f"\n🎉 Training complete! Final model → {SAVE_DIR}")
print(f"   Best val loss: {best_val_loss:.4f}")
