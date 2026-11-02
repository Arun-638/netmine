# =========================================================
# NetMine AI — Data Mining: DBSCAN Clustering & PCA
#
# Unsupervised traffic behavior profiling:
#   1. Projects flow features to 2D via Principal Component Analysis (PCA).
#   2. Fits DBSCAN (eps, min_samples) to group dense clusters & isolate noise (-1).
#   3. Profiles cluster properties (avg bytes, avg packets, dominant traffic).
#   4. Produces real 2D coordinates and cluster stats.
# =========================================================
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

ROOT_DIR = Path(__file__).parent.parent
DEFAULT_DATA_IN = ROOT_DIR / "data" / "processed" / "cicids2017_clean.parquet"
DEFAULT_DATA_OUT = ROOT_DIR / "data" / "processed" / "dbscan_results.json"

CLUSTER_COLORS = {
    -1: "#ef4444",
    0:  "#3b82f6",
    1:  "#10b981",
    2:  "#f59e0b",
    3:  "#8b5cf6",
    4:  "#06b6d4",
}

CLUSTER_NAMES = {
    -1: "Noise & Outliers (Anomalies / Probes)",
    0:  "Standard Web & Cloud Traffic (HTTP/HTTPS)",
    1:  "Low-Latency Service Queries (DNS / NTP)",
    2:  "High-Volume Data Streams & Downloads",
    3:  "Interactive SSH / Control Sessions",
    4:  "Transient Ephemeral Connections",
}


def load_dbscan_results(path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Loads previously computed real DBSCAN results from disk."""
    target_path = path or DEFAULT_DATA_OUT
    if target_path.exists():
        with open(target_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def run_dbscan_clustering(
    input_parquet: Optional[Path] = None,
    output_json: Optional[Path] = None,
    sample_size: int = 12000,
    eps: float = 0.45,
    min_samples: int = 30,
) -> Dict[str, Any]:
    """
    Executes real DBSCAN clustering and PCA dimension reduction on flow features.
    """
    in_path = input_parquet or DEFAULT_DATA_IN
    out_path = output_json or DEFAULT_DATA_OUT

    if not in_path.exists():
        raise FileNotFoundError(f"Input parquet dataset not found at {in_path}")

    features = [
        "Flow Bytes/s",
        "Total Fwd Packets",
        "Total Length of Fwd Packets",
        "Average Packet Size",
        "Flow Duration",
        "label",
    ]

    df = pd.read_parquet(in_path, columns=features)
    sample_df = df.sample(n=min(len(df), sample_size), random_state=42).reset_index(drop=True)

    feat_df = pd.DataFrame()
    feat_df["log_bytes"] = np.log1p(sample_df["Flow Bytes/s"].clip(lower=0))
    feat_df["log_pkts"] = np.log1p(sample_df["Total Fwd Packets"].clip(lower=0))
    feat_df["log_size"] = np.log1p(sample_df["Average Packet Size"].clip(lower=0))
    feat_df["log_duration"] = np.log1p(sample_df["Flow Duration"].clip(lower=0))

    X_scaled = StandardScaler().fit_transform(feat_df)

    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled)

    dbscan = DBSCAN(eps=eps, min_samples=min_samples, n_jobs=-1)
    cluster_labels = dbscan.fit_predict(X_scaled)

    sample_df["cluster"] = cluster_labels
    sample_df["pca_x"] = X_pca[:, 0]
    sample_df["pca_y"] = X_pca[:, 1]

    unique_clusters = sorted(list(set(cluster_labels)))
    noise_count = int((cluster_labels == -1).sum())

    cluster_summary_list = []
    for c_id in unique_clusters:
        c_subset = sample_df[sample_df["cluster"] == c_id]
        c_size = len(c_subset)
        avg_pkt = float(c_subset["Total Fwd Packets"].mean())
        avg_byt = float(c_subset["Total Length of Fwd Packets"].mean())
        dom_label = c_subset["label"].value_counts().index[0] if len(c_subset) > 0 else "UNKNOWN"

        cluster_summary_list.append({
            "id": int(c_id),
            "label": CLUSTER_NAMES.get(c_id, f"Cluster #{c_id}"),
            "size": c_size,
            "description": f"Dominant traffic: {dom_label}. Mean forward packets: {avg_pkt:.1f}, mean bytes: {avg_byt:.0f} B.",
            "avg_packets": round(avg_pkt, 1),
            "avg_bytes": round(avg_byt, 1),
            "color": CLUSTER_COLORS.get(c_id, "#6b7280"),
            "dominant_traffic": dom_label,
        })

    scatter_points = []
    for c_id in unique_clusters:
        pts = sample_df[sample_df["cluster"] == c_id]
        n_samples = min(len(pts), 70 if c_id != -1 else 100)
        sampled_pts = pts.sample(n=n_samples, random_state=42)
        for _, r in sampled_pts.iterrows():
            scatter_points.append({
                "x": round(float(r["pca_x"]), 3),
                "y": round(float(r["pca_y"]), 3),
                "cluster": int(r["cluster"]),
                "cluster_label": CLUSTER_NAMES.get(int(r["cluster"]), f"Cluster #{r['cluster']}"),
                "actual_label": str(r["label"]),
                "color": CLUSTER_COLORS.get(int(r["cluster"]), "#6b7280"),
            })

    result = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "algorithm": "DBSCAN",
        "eps": eps,
        "min_samples": min_samples,
        "total_flows": len(sample_df),
        "noise_count": noise_count,
        "cluster_count": len(unique_clusters) - (1 if -1 in unique_clusters else 0),
        "clusters": cluster_summary_list,
        "scatter_points": scatter_points,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    return result
