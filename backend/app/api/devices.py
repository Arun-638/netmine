from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import DeviceDB
from packet_capture.capture_engine import LiveCaptureEngine

router = APIRouter(prefix="/api/devices", tags=["Devices"])
engine = LiveCaptureEngine.get_instance()


@router.get("", summary="Get live device inventory from capture engine")
async def get_devices(
    status: Optional[str] = Query(None, description="Filter: active|suspicious|inactive"),
    db: Session = Depends(get_db),
) -> dict:
    """
    Returns network hosts discovered during live packet capture.
    Devices are derived from unique src/dst IPs seen in live captured flows.
    No demo data — shows empty list when capture has not started.
    """
    devices = engine.get_live_devices()

    # If in-memory is empty (e.g. backend restarted), fallback to live DB devices
    if not devices:
        q = db.query(DeviceDB)
        if status:
            q = q.filter(DeviceDB.status == status.lower())
        db_devs = q.order_by(DeviceDB.last_seen.desc()).all()
        for d in db_devs:
            try:
                import json
                protos = json.loads(d.protocols) if d.protocols else []
            except Exception:
                protos = []
            devices.append({
                "id": d.id,
                "ip": d.ip,
                "mac": d.mac or "--:--:--:--:--:--",
                "hostname": d.hostname or d.ip,
                "total_bytes": d.total_bytes,
                "total_packets": d.total_packets,
                "protocols": protos,
                "last_seen": d.last_seen.isoformat() if d.last_seen else "",
                "first_seen": d.first_seen.isoformat() if d.first_seen else "",
                "status": d.status,
            })

    if status and engine.get_live_devices():
        devices = [d for d in devices if d["status"] == status.lower()]

    return {
        "devices": devices,
        "total": len(devices),
        "data_source": "LIVE",
    }


@router.post("/clear", summary="Clear all discovered devices")
@router.delete("", summary="Clear all discovered devices")
async def clear_devices(db: Session = Depends(get_db)) -> dict:
    """Clears both in-memory live devices and DB device records."""
    with engine.lock:
        engine._live_devices.clear()

    deleted = db.query(DeviceDB).delete()
    db.commit()

    return {
        "status": "cleared",
        "deleted_records": deleted,
        "message": "All devices cleared from memory and database",
    }
