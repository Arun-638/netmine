# =========================================================
# NetMine AI — /api/anomalies
# Real-Time Live Capture Threat Stream + DB / Model Anomaly Archive
# =========================================================
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas import AnomalyList, Anomaly
from app.services import db_service
from packet_capture.capture_engine import LiveCaptureEngine

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])
engine = LiveCaptureEngine.get_instance()

ANOMALIES_JSON = Path(__file__).parent.parent.parent.parent / "data" / "processed" / "anomaly_results.json"


def load_real_anomalies() -> dict | None:
    if ANOMALIES_JSON.exists():
        with open(ANOMALIES_JSON, encoding="utf-8") as f:
            return json.load(f)
    return None


class AnomalyCreateRequest(BaseModel):
    src_ip: str
    dst_ip: str
    type: str
    severity: str = "high"
    score: float = 0.90
    description: str = ""
    status: str = "active"


class AnomalyStatusUpdateRequest(BaseModel):
    status: str  # "active" | "investigating" | "resolved"


@router.get("", response_model=AnomalyList, summary="Get anomalies from Live Capture or Database")
async def get_anomalies(
    severity: Optional[str] = Query(None, description="Filter: low|medium|high|critical"),
    status:   Optional[str] = Query(None, description="Filter: active|investigating|resolved"),
    source:   Optional[str] = Query("live", description="Filter: live|archive|benchmark"),
    db: Session = Depends(get_db),
) -> AnomalyList:
    """
    Returns anomaly records.
    - source='live' (default): Returns ONLY real-time anomalies detected during current capture/session.
    - source='archive': Returns persisted historical records from SQLite.
    - source='benchmark': Returns CICIDS2017 benchmark validation anomalies.
    """
    # ── 1. Live Threat Feed Mode (Strictly real-time) ───────────
    if source == "live":
        live_items = engine.get_recent_anomalies(limit=100)
        items = live_items
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
            data_source="LIVE_CAPTURE",
        )

    # ── 2. Database Archive Mode ───────────────────────────────
    if source == "archive":
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
            data_source="DB_PERSISTED",
        )

    # ── 3. CICIDS2017 Benchmark Evaluation Mode ────────────────
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
            data_source="ISOLATION_FOREST_BENCHMARK",
        )

    return AnomalyList(anomalies=[], total=0, active_count=0, data_source="EMPTY")


@router.post("/purge-stale", summary="Purge old resolved loopback test alerts from database")
async def purge_stale(db: Session = Depends(get_db)) -> dict:
    deleted = db_service.purge_stale_anomalies(db)
    engine.clear_anomalies()
    return {"status": "purged", "deleted_db_rows": deleted}


@router.post("", summary="Report a live detected anomaly")
async def report_anomaly(req: AnomalyCreateRequest, db: Session = Depends(get_db)) -> dict:
    timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    anom = engine.add_anomaly({
        "timestamp": timestamp_str,
        "src_ip": req.src_ip,
        "dst_ip": req.dst_ip,
        "type": req.type,
        "severity": req.severity,
        "score": req.score,
        "description": req.description or f"Live threat event: {req.type} from {req.src_ip}",
        "status": req.status,
        "data_source": "LIVE_CAPTURE",
    })
    # Mirror into recent_flows for unified display in Live Traffic
    flow_record = {
        "id": f"flow-live-{engine.total_flows + 1}",
        "timestamp": timestamp_str,
        "src_ip": req.src_ip,
        "dst_ip": req.dst_ip,
        "src_port": 50123,
        "dst_port": 80 if "Web" in req.type else (22 if "SSH" in req.type else 8080),
        "protocol": "TCP",
        "bytes": 32000,
        "packets": 85,
        "duration": 0.85,
        "label": req.type,
        "confidence": req.score,
        "anomaly_score": req.score,
        "data_source": "LIVE_CAPTURE",
    }
    with engine.lock:
        engine.total_flows += 1
        engine.recent_flows.appendleft(flow_record)

    try:
        db_service.create_anomaly(db, Anomaly(
            id=anom["id"], timestamp=anom["timestamp"], src_ip=anom["src_ip"],
            dst_ip=anom["dst_ip"], type=anom["type"], severity=anom["severity"],
            score=anom["score"], description=anom["description"], status=anom["status"],
        ))
    except Exception:
        pass
    return {"status": "created", "anomaly": anom}


@router.post("/simulate-threat", summary="Inject a test live threat anomaly for testing")
async def simulate_threat(
    threat_type: str = Query("PortScan", description="Threat type e.g. PortScan, DDoS, DoS Hulk, SSH-Brute, Web Attack"),
    src_ip: str = Query("192.168.1.185", description="Attacker IP"),
    dst_ip: str = Query("192.168.1.1", description="Victim IP"),
    severity: str = Query("high", description="Severity: low|medium|high|critical"),
    db: Session = Depends(get_db),
) -> dict:
    timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    anom = engine.add_anomaly({
        "timestamp": timestamp_str,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "type": threat_type,
        "severity": severity,
        "score": 0.94,
        "description": f"Live test threat: AI detected anomalous {threat_type} behavior across multiple probe packets.",
        "status": "active",
        "data_source": "LIVE_CAPTURE",
    })
    # Mirror into recent_flows for unified display in Live Traffic
    dport = 80 if "Web" in threat_type else (22 if "SSH" in threat_type else (8080 if "DDoS" in threat_type else 445))
    flow_record = {
        "id": f"flow-live-{engine.total_flows + 1}",
        "timestamp": timestamp_str,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": 49152,
        "dst_port": dport,
        "protocol": "TCP",
        "bytes": 45120,
        "packets": 118,
        "duration": 1.24,
        "label": threat_type,
        "confidence": 0.94,
        "anomaly_score": 0.88,
        "data_source": "LIVE_CAPTURE",
    }
    with engine.lock:
        engine.total_flows += 1
        engine.recent_flows.appendleft(flow_record)

    try:
        db_service.create_anomaly(db, Anomaly(
            id=anom["id"], timestamp=anom["timestamp"], src_ip=anom["src_ip"],
            dst_ip=anom["dst_ip"], type=anom["type"], severity=anom["severity"],
            score=anom["score"], description=anom["description"], status=anom["status"],
        ))
    except Exception:
        pass
    return {"status": "injected", "anomaly": anom}


@router.patch("/{anomaly_id}", summary="Update anomaly status (active/investigating/resolved)")
async def update_anomaly_status(anomaly_id: str, req: AnomalyStatusUpdateRequest, db: Session = Depends(get_db)) -> dict:
    engine.update_anomaly_status(anomaly_id, req.status)
    db_service.update_anomaly_status(db, anomaly_id, req.status)
    return {"status": "updated", "id": anomaly_id, "new_status": req.status}


@router.post("/clear", summary="Clear live stream anomalies")
async def clear_live_anomalies() -> dict:
    engine.clear_anomalies()
    return {"status": "cleared"}


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
