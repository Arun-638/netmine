# =========================================================
# NetMine AI — /api/anomalies (Phase 7 updated)
#
# Returns real Isolation Forest anomaly detections from
# data/processed/anomaly_results.json or database.
# =========================================================
import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas import AnomalyList, Anomaly
from app.services import db_service

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])

ANOMALIES_JSON = Path(__file__).parent.parent.parent.parent / "data" / "processed" / "anomaly_results.json"


def load_real_anomalies() -> dict | None:
    if ANOMALIES_JSON.exists():
        with open(ANOMALIES_JSON, encoding="utf-8") as f:
            return json.load(f)
    return None


@router.get("", response_model=AnomalyList, summary="Get anomalies from Isolation Forest / Database")
async def get_anomalies(
    severity: Optional[str] = Query(None, description="Filter: low|medium|high|critical"),
    status:   Optional[str] = Query(None, description="Filter: active|investigating|resolved"),
    db: Session = Depends(get_db),
) -> AnomalyList:
    """
    Returns anomaly records.
    - If Phase 7 has run: returns real scored anomalies from Isolation Forest on CICIDS2017.
    - Otherwise: returns records from SQLite.
    """
    real_data = load_real_anomalies()
    if real_data and "sample_anomalies" in real_data:
        items = real_data["sample_anomalies"]
        if severity:
            items = [a for a in items if a.get("severity") == severity]
        if status:
            items = [a for a in items if a.get("status") == status]

        anomalies = [
            Anomaly(
                id=a["id"],
                timestamp=a["timestamp"],
                src_ip=a["src_ip"],
                dst_ip=a["dst_ip"],
                type=a["type"],
                severity=a["severity"],
                score=a["score"],
                description=a["description"],
                status=a["status"],
            )
            for a in items
        ]
        active_count = sum(1 for a in items if a.get("status") == "active")
        return AnomalyList(
            anomalies=anomalies,
            total=len(anomalies),
            active_count=active_count,
            data_source="ISOLATION_FOREST_MEASURED",
        )

    # Fallback to DB
    rows = db_service.get_anomalies(db, severity=severity, status=status)
    anomalies = [
        Anomaly(
            id=r.id,
            timestamp=r.timestamp.isoformat() if hasattr(r.timestamp, "isoformat") else str(r.timestamp),
            src_ip=r.src_ip, dst_ip=r.dst_ip, type=r.type,
            severity=r.severity, score=r.score,
            description=r.description, status=r.status,
        )
        for r in rows
    ]
    active_count = db_service.count_active_anomalies(db)
    return AnomalyList(
        anomalies=anomalies,
        total=len(anomalies),
        active_count=active_count,
        data_source="DB_DEMO",
    )


@router.get("/metrics", summary="Isolation Forest evaluation metrics")
async def get_anomaly_metrics() -> dict:
    real_data = load_real_anomalies()
    if not real_data:
        return {"status": "not_trained", "message": "Run notebooks/03_anomaly_mining.py"}
    return {
        "status": "trained",
        "model": real_data.get("model", "Isolation Forest"),
        "generated_at": real_data.get("generated_at"),
        "evaluated_samples": real_data.get("evaluated_samples"),
        "attack_detection_rate": real_data.get("attack_detection_rate"),
        "false_positive_rate": real_data.get("false_positive_rate"),
        "contamination": real_data.get("contamination"),
        "total_flagged": real_data.get("total_anomalies_flagged"),
    }
