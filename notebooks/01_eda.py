# NetMine AI — Phase 5: CICIDS2017 EDA (fixed for Windows cp1252 + pandas 3.x CoW)
import os, sys, time
import numpy as np
import pandas as pd
from pathlib import Path

# Force UTF-8 output on Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT     = Path(__file__).parent.parent
DATA_RAW = ROOT / "data" / "raw" / "CICIDS2017"
DATA_OUT = ROOT / "data" / "processed"
DATA_OUT.mkdir(parents=True, exist_ok=True)

CSV_FILES = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
]

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

# ── STEP 1: Load all CSVs ─────────────────────────────────
log("=== STEP 1: Loading CSV files ===")
frames = []
for fname in CSV_FILES:
    fpath = DATA_RAW / fname
    if not fpath.exists():
        log(f"  MISSING: {fname}"); continue
    t0 = time.time()
    part = pd.read_csv(fpath, low_memory=False)
    part["source_file"] = fname.split(".")[0]
    log(f"  {fname}: {len(part):,} rows in {time.time()-t0:.1f}s")
    frames.append(part)

if not frames:
    log("ERROR: No CSV files found!"); sys.exit(1)

df = pd.concat(frames, ignore_index=True)
log(f"\n  Combined: {df.shape[0]:,} rows x {df.shape[1]} cols")

# ── STEP 2: Clean column names ────────────────────────────
log("\n=== STEP 2: Cleaning column names ===")
df.columns = df.columns.str.strip()
df.rename(columns={"Label": "label"}, inplace=True)
df["label"] = df["label"].str.strip()
log(f"  Unique labels: {df['label'].nunique()}")

# ── STEP 3: Replace Infinity (pandas 3.x CoW-safe) ───────
log("\n=== STEP 3: Replacing Inf values ===")
inf_count = 0
num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
for col in num_cols:
    n = np.isinf(df[col]).sum()
    if n > 0:
        df[col] = df[col].replace([np.inf, -np.inf], np.nan)
        log(f"  {col}: {n:,} Inf replaced")
        inf_count += n
log(f"  Total Inf replaced: {inf_count:,}")

# ── STEP 4: Fill NaN with median (CoW-safe) ───────────────
log("\n=== STEP 4: Filling NaN with median ===")
nan_before = int(df.isnull().sum().sum())
for col in num_cols:
    if df[col].isnull().any():
        df[col] = df[col].fillna(df[col].median())
nan_after = int(df.isnull().sum().sum())
log(f"  NaN before: {nan_before:,}  |  after: {nan_after:,}")

# ── STEP 5: Remove duplicates ─────────────────────────────
log("\n=== STEP 5: Deduplication ===")
before = len(df)
df = df.drop_duplicates()
df = df.reset_index(drop=True)
log(f"  Removed {before-len(df):,} duplicates. Remaining: {len(df):,}")

# ── STEP 6: Class distribution ───────────────────────────
log("\n=== STEP 6: CLASS DISTRIBUTION ===")
dist  = df["label"].value_counts()
total = len(df)
log(f"  {'Label':<50} {'Count':>10}  {'%':>7}")
log(f"  {'-'*70}")
for lbl, cnt in dist.items():
    pct = cnt / total * 100
    bar_len = int((cnt / dist.max()) * 25)
    bar = "#" * bar_len   # ASCII only — safe on all terminals
    log(f"  {lbl:<50} {cnt:>10,}  {pct:>6.2f}%  {bar}")

# ── STEP 7: Feature statistics ───────────────────────────
log("\n=== STEP 7: Top 10 highest-variance features ===")
top10 = df[num_cols].std().nlargest(10)
for feat, std_val in top10.items():
    log(f"  {feat:<45}: std={std_val:>14.2f}  mean={df[feat].mean():>14.2f}")

# ── STEP 8: Zero-variance features ───────────────────────
log("\n=== STEP 8: Constant (zero-variance) features ===")
zero_var = [c for c in num_cols if df[c].std() == 0]
if zero_var:
    for col in zero_var:
        log(f"  CONSTANT: {col}  value={df[col].iloc[0]}")
else:
    log("  None found.")

# ── STEP 9: Save Parquet ──────────────────────────────────
log("\n=== STEP 9: Saving clean Parquet ===")
out = DATA_OUT / "cicids2017_clean.parquet"
t0  = time.time()
df.to_parquet(out, index=False, compression="snappy")
log(f"  Saved:  {out}")
log(f"  Size:   {out.stat().st_size/1e6:.1f} MB  |  Time: {time.time()-t0:.1f}s")
log(f"  Shape:  {len(df):,} rows x {df.shape[1]} cols")

# ── STEP 10: Save EDA text report ────────────────────────
log("\n=== STEP 10: Saving EDA report ===")
report = DATA_OUT / "eda_report.txt"
lines  = [
    "NetMine AI -- CICIDS2017 EDA Report",
    "=" * 60,
    f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
    f"Combined rows: {len(df):,}  |  Cols: {df.shape[1]}",
    "",
    "CLASS DISTRIBUTION:",
    f"  {'Label':<50} {'Count':>10}  {'%':>7}",
    "-" * 70,
]
for lbl, cnt in dist.items():
    lines.append(f"  {lbl:<50} {cnt:>10,}  {cnt/total*100:>6.2f}%")

lines += [
    "",
    "DATA QUALITY:",
    f"  Inf replaced:   {inf_count:,}",
    f"  NaN filled:     {nan_before:,}",
    f"  Dups removed:   {before-len(df):,}",
    "",
    "CONSTANT FEATURES (zero variance, can be dropped):",
]
for col in (zero_var if zero_var else ["None"]):
    lines.append(f"  {col}")

lines += [
    "",
    f"OUTPUT: {out}",
    "NEXT:   Phase 6 -- Feature Engineering + ML Training",
    "        Run: notebooks/02_feature_engineering.py",
]
report.write_text("\n".join(lines), encoding="utf-8")
log(f"  Report: {report}")
log("\n=== Phase 5 EDA COMPLETE ===")
