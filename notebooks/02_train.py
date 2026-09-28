# =========================================================
# NetMine AI — Phase 6: Feature Engineering + ML Training
#
# RUN FROM f:\netmine:
#   .venv\Scripts\python.exe notebooks\02_train.py
#
# WHAT THIS SCRIPT DOES:
#   Step 1  Load the cleaned parquet from Phase 5
#   Step 2  Drop zero-variance + irrelevant features
#   Step 3  Encode labels (string -> integer)
#   Step 4  Handle class imbalance (undersample majority)
#   Step 5  Train/test split (80/20, stratified)
#   Step 6  Feature scaling (StandardScaler)
#   Step 7  Train Decision Tree
#   Step 8  Train Random Forest
#   Step 9  Train XGBoost
#   Step 10 Evaluate all models (accuracy, precision, recall, F1)
#   Step 11 Save models as .joblib files
#   Step 12 Save metrics to data/processed/ml_results.json
#
# WHY THESE MODELS:
#   Decision Tree  — explainable, fast, baseline
#   Random Forest  — ensemble, handles noise, better accuracy
#   XGBoost        — gradient boosting, state-of-art for tabular data
#
# CLASS IMBALANCE STRATEGY:
#   BENIGN = 83.46% of data. Training on raw data would bias
#   the model to always predict BENIGN (gets 83% accuracy for free).
#   We undersample BENIGN to 3x the largest attack class.
#   This forces the model to actually learn attack patterns.
# =========================================================

import json, sys, time, io
import numpy as np
import pandas as pd
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT     = Path(__file__).parent.parent
DATA_OUT = ROOT / "data" / "processed"
MODELS   = ROOT / "models"
MODELS.mkdir(parents=True, exist_ok=True)

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

# ── STEP 1: Load cleaned Parquet ─────────────────────────
log("=== STEP 1: Loading cleaned Parquet ===")
parquet = DATA_OUT / "cicids2017_clean.parquet"
if not parquet.exists():
    log("ERROR: Run notebooks/01_eda.py first!"); sys.exit(1)

t0 = time.time()
df = pd.read_parquet(parquet)
log(f"  Loaded: {len(df):,} rows x {df.shape[1]} cols in {time.time()-t0:.1f}s")

# ── STEP 2: Drop zero-variance + irrelevant features ──────
log("\n=== STEP 2: Feature selection ===")
# These 8 columns are always 0 in CICIDS2017 (found in EDA)
ZERO_VAR = [
    "Bwd PSH Flags", "Bwd URG Flags",
    "Fwd Avg Bytes/Bulk", "Fwd Avg Packets/Bulk", "Fwd Avg Bulk Rate",
    "Bwd Avg Bytes/Bulk", "Bwd Avg Packets/Bulk", "Bwd Avg Bulk Rate",
]
# These are non-numeric or metadata columns — NOT features
META = ["source_file"]

drop_cols = [c for c in ZERO_VAR + META if c in df.columns]
df.drop(columns=drop_cols, inplace=True)
log(f"  Dropped {len(drop_cols)} columns: {drop_cols}")
log(f"  Remaining: {df.shape[1]} columns")

# Separate features and label
LABEL_COL = "label"
feature_cols = [c for c in df.columns if c != LABEL_COL]
log(f"  Feature count: {len(feature_cols)}")

# ── STEP 3: Encode labels ─────────────────────────────────
log("\n=== STEP 3: Label encoding ===")
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()
df["label_enc"] = le.fit_transform(df[LABEL_COL])
classes = list(le.classes_)
log(f"  Classes ({len(classes)}):")
for i, c in enumerate(classes):
    log(f"    {i:2d} -> {c}")

# Save label encoder mapping
mapping = {str(i): c for i, c in enumerate(classes)}
(DATA_OUT / "label_mapping.json").write_text(
    json.dumps(mapping, indent=2), encoding="utf-8"
)

# ── STEP 4: Handle class imbalance (undersample) ──────────
log("\n=== STEP 4: Class balancing ===")
dist = df["label_enc"].value_counts()
benign_enc = le.transform(["BENIGN"])[0]
largest_attack = dist.drop(index=benign_enc).max()
benign_cap     = min(int(largest_attack * 3), dist[benign_enc])
log(f"  BENIGN before: {dist[benign_enc]:,}")
log(f"  Largest attack class: {largest_attack:,}")
log(f"  BENIGN cap (3x): {benign_cap:,}")

benign_df     = df[df["label_enc"] == benign_enc].sample(n=benign_cap, random_state=42)
non_benign_df = df[df["label_enc"] != benign_enc]
df_balanced   = pd.concat([benign_df, non_benign_df]).sample(frac=1, random_state=42).reset_index(drop=True)
log(f"  Balanced dataset: {len(df_balanced):,} rows")
log(f"  Class distribution after balancing:")
for lbl_enc, cnt in df_balanced["label_enc"].value_counts().items():
    log(f"    {le.classes_[lbl_enc]:<45}: {cnt:>8,}")

X = df_balanced[feature_cols].values
y = df_balanced["label_enc"].values

# ── STEP 5: Train/test split ──────────────────────────────
log("\n=== STEP 5: Train/test split (80/20, stratified) ===")
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
log(f"  Train: {X_train.shape[0]:,} rows")
log(f"  Test:  {X_test.shape[0]:,} rows")

# ── STEP 6: Feature scaling ───────────────────────────────
log("\n=== STEP 6: StandardScaler ===")
from sklearn.preprocessing import StandardScaler
import joblib
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)
joblib.dump(scaler, MODELS / "scaler.joblib")
log(f"  Scaler fitted and saved.")

# ── Helper: evaluate + report ─────────────────────────────
def evaluate(name, model, X_tr, y_tr, X_te, y_te):
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        classification_report,
    )
    t0 = time.time()
    model.fit(X_tr, y_tr)
    t_train = time.time() - t0
    y_pred  = model.predict(X_te)
    acc  = accuracy_score(y_te, y_pred)
    prec = precision_score(y_te, y_pred, average="weighted", zero_division=0)
    rec  = recall_score(y_te, y_pred, average="weighted", zero_division=0)
    f1   = f1_score(y_te, y_pred, average="weighted", zero_division=0)

    log(f"\n  {name}")
    log(f"    Train time:  {t_train:.1f}s")
    log(f"    Accuracy:    {acc:.4f}  ({acc*100:.2f}%)")
    log(f"    Precision:   {prec:.4f}")
    log(f"    Recall:      {rec:.4f}")
    log(f"    F1 Score:    {f1:.4f}")
    log(f"\n  Per-class report:")
    report = classification_report(y_te, y_pred, target_names=classes, zero_division=0)
    for line in report.split("\n"):
        log(f"    {line}")

    return {"accuracy": round(acc, 6), "precision": round(prec, 6),
            "recall": round(rec, 6), "f1_score": round(f1, 6),
            "train_time_s": round(t_train, 2)}

all_results = {}

# ── STEP 7: Decision Tree ─────────────────────────────────
log("\n=== STEP 7: Decision Tree ===")
from sklearn.tree import DecisionTreeClassifier
dt = DecisionTreeClassifier(max_depth=20, min_samples_split=10, random_state=42)
all_results["Decision Tree"] = evaluate("Decision Tree", dt, X_train_s, y_train, X_test_s, y_test)
joblib.dump(dt, MODELS / "decision_tree.joblib")
log("  Saved: models/decision_tree.joblib")

# ── STEP 8: Random Forest ─────────────────────────────────
log("\n=== STEP 8: Random Forest ===")
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=100, max_depth=20, n_jobs=-1, random_state=42)
all_results["Random Forest"] = evaluate("Random Forest", rf, X_train_s, y_train, X_test_s, y_test)
joblib.dump(rf, MODELS / "random_forest.joblib")
log("  Saved: models/random_forest.joblib")

# ── STEP 9: XGBoost ───────────────────────────────────────
log("\n=== STEP 9: XGBoost ===")
import xgboost as xgb
xgb_model = xgb.XGBClassifier(
    n_estimators=200, max_depth=8, learning_rate=0.1,
    n_jobs=-1, random_state=42, eval_metric="mlogloss",
    verbosity=0,
)
all_results["XGBoost"] = evaluate("XGBoost", xgb_model, X_train_s, y_train, X_test_s, y_test)
joblib.dump(xgb_model, MODELS / "xgboost.joblib")
log("  Saved: models/xgboost.joblib")

# ── STEP 10: Summary ──────────────────────────────────────
log("\n=== STEP 10: MODEL COMPARISON SUMMARY ===")
log(f"  {'Model':<20} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
log(f"  {'-'*62}")
best_model = max(all_results, key=lambda m: all_results[m]["f1_score"])
for model, r in all_results.items():
    marker = " <-- BEST" if model == best_model else ""
    log(f"  {model:<20} {r['accuracy']:>10.4f} {r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1_score']:>10.4f}{marker}")

# ── STEP 11: Save ML results JSON ─────────────────────────
log("\n=== STEP 11: Saving ML results ===")
results_out = {
    "generated_at":    time.strftime("%Y-%m-%d %H:%M:%S"),
    "dataset":         "CICIDS2017",
    "train_rows":      int(X_train.shape[0]),
    "test_rows":       int(X_test.shape[0]),
    "feature_count":   len(feature_cols),
    "feature_names":   feature_cols,
    "classes":         classes,
    "label_mapping":   mapping,
    "best_model":      best_model,
    "results":         all_results,
}
out_json = DATA_OUT / "ml_results.json"
out_json.write_text(json.dumps(results_out, indent=2), encoding="utf-8")
log(f"  Saved: {out_json}")
log("\n=== Phase 6 ML Training COMPLETE ===")
log(f"  Best model: {best_model}  (F1={all_results[best_model]['f1_score']:.4f})")
log("  Next: Phase 7 — Anomaly Detection (Isolation Forest + DBSCAN)")
