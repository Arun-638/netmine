# =========================================================
# NetMine AI — Database Seeder
#
# WHY WE SEED:
#   The database starts empty. Without seeding, all endpoints
#   return empty lists. We seed the same demo data that was
#   previously hardcoded in mock_data.py so that:
#   - Development works immediately after startup
#   - The API responses are consistent with Phase 3
#   - We can verify DB queries work correctly before
#     connecting real data (Phase 9)
#
# HOW IT WORKS:
#   Called once at application startup (see main.py lifespan).
#   Uses INSERT OR IGNORE — safe to call multiple times.
#   Will NOT overwrite existing real data.
# =========================================================
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database.models import TrafficFlowDB, AnomalyDB, DeviceDB
from app.services.mock_data import DEMO_FLOWS, DEMO_ANOMALIES, DEMO_DEVICES


def parse_dt(ts: str) -> datetime:
    """Parse ISO 8601 timestamp string to timezone-aware datetime."""
    # Handle both 'Z' suffix and '+00:00' offset
    ts = ts.replace("Z", "+00:00")
    return datetime.fromisoformat(ts)


def is_seeded(db: Session) -> bool:
    """Check if the DB already has data (avoids duplicate seeding)."""
    try:
        return db.query(TrafficFlowDB).count() > 0
    except Exception:
        return False


def seed_demo_data(db: Session) -> dict:
    """
    Populate the database with demo data from mock_data.py.
    Returns a summary of what was inserted.
    """
    if is_seeded(db):
        return {"status": "already_seeded", "message": "Database already contains data, skipping seed."}

    flows_inserted = 0
    for flow in DEMO_FLOWS:
        existing = db.query(TrafficFlowDB).filter(TrafficFlowDB.id == flow.id).first()
        if not existing:
            row = TrafficFlowDB(
                id=flow.id, timestamp=parse_dt(flow.timestamp), src_ip=flow.src_ip,
                dst_ip=flow.dst_ip, src_port=flow.src_port, dst_port=flow.dst_port,
                protocol=flow.protocol, bytes=flow.bytes, packets=flow.packets,
                duration=flow.duration, label=flow.label, confidence=flow.confidence,
                data_source="DEMO",
            )
            db.add(row)
            flows_inserted += 1

    anomalies_inserted = 0
    for anomaly in DEMO_ANOMALIES:
        existing = db.query(AnomalyDB).filter(AnomalyDB.id == anomaly.id).first()
        if not existing:
            row = AnomalyDB(
                id=anomaly.id, timestamp=parse_dt(anomaly.timestamp), src_ip=anomaly.src_ip,
                dst_ip=anomaly.dst_ip, type=anomaly.type, severity=anomaly.severity,
                score=anomaly.score, description=anomaly.description, status=anomaly.status,
            )
            db.add(row)
            anomalies_inserted += 1

    devices_inserted = 0
    for device in DEMO_DEVICES:
        existing = db.query(DeviceDB).filter(DeviceDB.ip == device.ip).first()
        if not existing:
            row = DeviceDB(
                id=device.id, ip=device.ip, mac=device.mac, hostname=device.hostname,
                first_seen=parse_dt(device.first_seen), last_seen=parse_dt(device.last_seen),
                total_bytes=device.total_bytes, total_packets=device.total_packets,
                protocols=json.dumps(device.protocols), status=device.status,
            )
            db.add(row)
            devices_inserted += 1

    db.commit()

    return {
        "status": "seeded",
        "flows_inserted":    flows_inserted,
        "anomalies_inserted": anomalies_inserted,
        "devices_inserted":  devices_inserted,
        "data_source":       "DEMO",
        "message":           "Database seeded with demo data. This will be replaced by real capture data in Phase 9.",
    }
