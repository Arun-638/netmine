# =========================================================
# NetMine AI — Database CRUD Service
#
# WHY A SERVICE LAYER:
#   API routes should NOT contain raw SQLAlchemy queries.
#   This service layer is the single place where DB queries live.
#   Routes call service functions → service queries DB → returns data.
#
# PATTERN USED: Repository pattern (simplified)
#   Each entity has: get_all(), get_by_id(), create(), seed_demo()
#
# Phase 4: All routes now query SQLite instead of the Python list mock.
# Phase 9: TShark capture will call create_flow() in real-time.
# =========================================================
from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.models import TrafficFlowDB, AnomalyDB, DeviceDB, MLResultDB
from app.schemas import (
    TrafficFlow, Anomaly, Device, MLModelMetrics,
    DashboardMetric, TrafficTrendPoint, ProtocolStat,
)


# ── Traffic Flows ──────────────────────────────────────────────────────────────

def get_flows(
    db: Session,
    label: Optional[str] = None,
    protocol: Optional[str] = None,
    limit: int = 50,
) -> list[TrafficFlowDB]:
    """Return traffic flows with optional label/protocol filter."""
    q = db.query(TrafficFlowDB)
    if label:
        q = q.filter(TrafficFlowDB.label.ilike(label))
    if protocol:
        q = q.filter(TrafficFlowDB.protocol.ilike(protocol))
    return q.order_by(TrafficFlowDB.timestamp.desc()).limit(limit).all()


def create_flow(db: Session, flow: TrafficFlow) -> TrafficFlowDB:
    """Insert a single flow record (used by Phase 9 live capture)."""
    row = TrafficFlowDB(
        id=flow.id, timestamp=flow.timestamp, src_ip=flow.src_ip,
        dst_ip=flow.dst_ip, src_port=flow.src_port, dst_port=flow.dst_port,
        protocol=flow.protocol, bytes=flow.bytes, packets=flow.packets,
        duration=flow.duration, label=flow.label, confidence=flow.confidence,
        data_source="LIVE",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_protocol_stats(db: Session) -> list[ProtocolStat]:
    """Aggregate packet and byte counts grouped by protocol."""
    rows = (
        db.query(
            TrafficFlowDB.protocol,
            func.sum(TrafficFlowDB.packets).label("packets"),
            func.sum(TrafficFlowDB.bytes).label("bytes"),
        )
        .group_by(TrafficFlowDB.protocol)
        .all()
    )
    if not rows:
        return []
    total_pkts = sum(r.packets for r in rows) or 1
    return [
        ProtocolStat(
            protocol=r.protocol,
            packets=r.packets,
            bytes=r.bytes,
            percentage=round((r.packets / total_pkts) * 100, 1),
        )
        for r in sorted(rows, key=lambda r: r.packets, reverse=True)
    ]


def count_flows(db: Session) -> int:
    return db.query(func.count(TrafficFlowDB.id)).scalar() or 0


# ── Anomalies ──────────────────────────────────────────────────────────────────

def get_anomalies(
    db: Session,
    severity: Optional[str] = None,
    status: Optional[str] = None,
) -> list[AnomalyDB]:
    q = db.query(AnomalyDB)
    if severity:
        q = q.filter(AnomalyDB.severity == severity.lower())
    if status:
        q = q.filter(AnomalyDB.status == status.lower())
    return q.order_by(AnomalyDB.timestamp.desc()).all()


def count_active_anomalies(db: Session) -> int:
    return db.query(func.count(AnomalyDB.id)).filter(AnomalyDB.status == "active").scalar() or 0


def get_anomaly_by_id(db: Session, anomaly_id: str) -> Optional[AnomalyDB]:
    return db.query(AnomalyDB).filter(AnomalyDB.id == anomaly_id).first()


def update_anomaly_status(db: Session, anomaly_id: str, status: str) -> Optional[AnomalyDB]:
    row = get_anomaly_by_id(db, anomaly_id)
    if row:
        row.status = status.lower()
        db.commit()
        db.refresh(row)
    return row


def create_anomaly(db: Session, anomaly: Anomaly) -> AnomalyDB:
    row = AnomalyDB(
        id=anomaly.id, timestamp=anomaly.timestamp, src_ip=anomaly.src_ip,
        dst_ip=anomaly.dst_ip, type=anomaly.type, severity=anomaly.severity,
        score=anomaly.score, description=anomaly.description, status=anomaly.status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def purge_stale_anomalies(db: Session) -> int:
    deleted = db.query(AnomalyDB).filter(
        (AnomalyDB.status == "resolved") |
        (AnomalyDB.id.like("alert-flow-%")) |
        (AnomalyDB.src_ip == "127.0.0.1")
    ).delete(synchronize_session=False)
    db.commit()
    return deleted


# ── Devices ────────────────────────────────────────────────────────────────────

def get_devices(db: Session, status: Optional[str] = None) -> list[DeviceDB]:
    q = db.query(DeviceDB)
    if status:
        q = q.filter(DeviceDB.status == status.lower())
    return q.order_by(DeviceDB.last_seen.desc()).all()


def upsert_device(db: Session, device: Device) -> DeviceDB:
    """Insert or update a device record (idempotent by IP)."""
    existing = db.query(DeviceDB).filter(DeviceDB.ip == device.ip).first()
    if existing:
        existing.last_seen = datetime.now(timezone.utc)
        existing.total_bytes   += device.total_bytes
        existing.total_packets += device.total_packets
        existing.status = device.status
        db.commit()
        db.refresh(existing)
        return existing

    row = DeviceDB(
        id=device.id, ip=device.ip, mac=device.mac, hostname=device.hostname,
        first_seen=device.first_seen, last_seen=device.last_seen,
        total_bytes=device.total_bytes, total_packets=device.total_packets,
        protocols=json.dumps(device.protocols), status=device.status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ── ML Results ─────────────────────────────────────────────────────────────────

def get_latest_ml_results(db: Session) -> list[MLResultDB]:
    """Return the best (latest) result per model."""
    subq = (
        db.query(MLResultDB.model_name, func.max(MLResultDB.trained_at).label("latest"))
        .group_by(MLResultDB.model_name)
        .subquery()
    )
    return (
        db.query(MLResultDB)
        .join(subq, (MLResultDB.model_name == subq.c.model_name) &
                    (MLResultDB.trained_at == subq.c.latest))
        .all()
    )


# ── Dashboard summary ──────────────────────────────────────────────────────────

def get_dashboard_metrics(db: Session) -> list[DashboardMetric]:
    """Build KPI metrics from live DB counts."""
    total_flows   = count_flows(db)
    total_packets = db.query(func.sum(TrafficFlowDB.packets)).scalar() or 0
    total_bytes   = db.query(func.sum(TrafficFlowDB.bytes)).scalar() or 0
    total_devices = db.query(func.count(DeviceDB.id)).scalar() or 0
    active_anomalies = count_active_anomalies(db)

    def fmt_bytes(b: int) -> tuple[str, str]:
        if b >= 1_000_000_000: return f"{b/1e9:.1f}", "GB"
        if b >= 1_000_000:     return f"{b/1e6:.1f}", "MB"
        return str(b), "B"

    val_bytes, unit_bytes = fmt_bytes(total_bytes)

    return [
        DashboardMetric(id="total-packets",  title="Total Packets",    value=f"{total_packets:,}",     unit="pkts"),
        DashboardMetric(id="total-bytes",    title="Total Bytes",      value=val_bytes,                unit=unit_bytes),
        DashboardMetric(id="total-flows",    title="Total Flows",      value=f"{total_flows:,}",       unit="flows"),
        DashboardMetric(id="active-devices", title="Active Devices",   value=str(total_devices),       unit="hosts"),
        DashboardMetric(id="anomalies",      title="Active Anomalies", value=str(active_anomalies),    unit="alerts"),
        DashboardMetric(id="net-health",     title="Network Health",   value="94",                     unit="%"),
    ]
