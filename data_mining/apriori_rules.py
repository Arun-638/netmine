# =========================================================
# NetMine AI — Data Mining: Apriori Association Rule Mining
#
# Network Knowledge Discovery:
#   1. Discretizes continuous flow features (Port, Duration, Rate,
#      Payload Size, TCP Flags, Attack Label) into boolean transaction matrix.
#   2. Uses mlxtend to extract frequent itemsets and association rules.
#   3. Computes Support, Confidence, and Lift metrics for cyber threat rules.
# =========================================================
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

ROOT_DIR = Path(__file__).parent.parent
DEFAULT_DATA_IN = ROOT_DIR / "data" / "processed" / "cicids2017_clean.parquet"
DEFAULT_DATA_OUT = ROOT_DIR / "data" / "processed" / "association_rules.json"


def load_association_rules(path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Loads previously mined Apriori rules from disk."""
    target_path = path or DEFAULT_DATA_OUT
    if target_path.exists():
        with open(target_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def run_apriori_mining(
    input_parquet: Optional[Path] = None,
    output_json: Optional[Path] = None,
    sample_size: int = 30000,
    min_support: float = 0.015,
    min_confidence: float = 0.50,
    min_lift: float = 1.1,
) -> Dict[str, Any]:
    """
    Executes Apriori association rule mining across network flow transactions.
    """
    in_path = input_parquet or DEFAULT_DATA_IN
    out_path = output_json or DEFAULT_DATA_OUT

    if not in_path.exists():
        raise FileNotFoundError(f"Input parquet dataset not found at {in_path}")

    features = [
        "Destination Port",
        "Flow Duration",
        "Flow Packets/s",
        "Total Length of Fwd Packets",
        "SYN Flag Count",
        "ACK Flag Count",
        "FIN Flag Count",
        "label",
    ]

    df = pd.read_parquet(in_path, columns=features)
    trans_sample = df.sample(n=min(len(df), sample_size), random_state=42).copy()

    transactions = pd.DataFrame(index=trans_sample.index)

    p = trans_sample["Destination Port"]
    transactions["Port:Web (80/443)"] = p.isin([80, 443, 8080])
    transactions["Port:SSH (22)"] = p == 22
    transactions["Port:FTP (21)"] = p == 21
    transactions["Port:DNS (53)"] = p == 53
    transactions["Port:Ephemeral (>1024)"] = p > 1024

    transactions["Rate:High (>500 pkt/s)"] = trans_sample["Flow Packets/s"] > 500
    transactions["Rate:Low (<10 pkt/s)"] = trans_sample["Flow Packets/s"] < 10
    transactions["Bytes:High (>10KB)"] = trans_sample["Total Length of Fwd Packets"] > 10000
    transactions["Bytes:Small (<500B)"] = trans_sample["Total Length of Fwd Packets"] < 500
    transactions["Duration:Short (<1s)"] = trans_sample["Flow Duration"] < 1000000

    transactions["Flag:SYN_Active"] = trans_sample["SYN Flag Count"] > 0
    transactions["Flag:ACK_Active"] = trans_sample["ACK Flag Count"] > 0
    transactions["Flag:FIN_Active"] = trans_sample["FIN Flag Count"] > 0

    lbl = trans_sample["label"]
    transactions["Traffic:Attack"] = lbl != "BENIGN"
    transactions["Traffic:DoS"] = lbl.str.contains("DoS|DDoS", regex=True)
    transactions["Traffic:PortScan"] = lbl == "PortScan"
    transactions["Traffic:BruteForce"] = lbl.str.contains("Patator", regex=True)
    transactions["Traffic:BENIGN"] = lbl == "BENIGN"

    frequent_itemsets = apriori(transactions, min_support=min_support, use_colnames=True)
    rules_df = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
    rules_df = rules_df[rules_df["confidence"] >= min_confidence]

    interesting_rules = []
    rule_id = 1
    for _, row in rules_df.iterrows():
        ant = list(row["antecedents"])
        con = list(row["consequents"])

        # Prioritize rules involving cybersecurity attack patterns
        is_security_rule = any("Traffic:" in str(x) for x in ant + con)
        if is_security_rule or row["lift"] > 1.5:
            interesting_rules.append({
                "id": f"rule-{rule_id:03d}",
                "antecedent": [str(x) for x in ant],
                "consequent": [str(x) for x in con],
                "support": round(float(row["support"]), 4),
                "confidence": round(float(row["confidence"]), 4),
                "lift": round(float(row["lift"]), 3),
            })
            rule_id += 1

    interesting_rules.sort(key=lambda r: (r["lift"], r["confidence"]), reverse=True)
    selected_rules = interesting_rules[:25]

    result = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "algorithm": "Apriori",
        "min_support": min_support,
        "min_confidence": min_confidence,
        "min_lift": min_lift,
        "total_rules_discovered": len(rules_df),
        "rules": selected_rules,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    return result
