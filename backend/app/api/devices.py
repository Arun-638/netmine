from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
import json
from app.database.session import get_db
from app.schemas import DeviceList, Device
from app.services import db_service

router = APIRouter(prefix="/api/devices", tags=["Devices"])


@router.get("", response_model=DeviceList, summary="Get device inventory from database")
async def get_devices(
    status: Optional[str] = Query(None, description="Filter: active|suspicious|inactive"),
    db: Session = Depends(get_db),
) -> DeviceList:
    """
    Returns network host inventory from SQLite.
    Phase 4: Demo devices seeded on startup.
    Phase 9: Devices discovered from live TShark capture.
    """
    rows = db_service.get_devices(db, status=status)
    devices = [
        Device(
            id=r.id, ip=r.ip, mac=r.mac, hostname=r.hostname,
            first_seen=r.first_seen.isoformat() if hasattr(r.first_seen, "isoformat") else str(r.first_seen),
            last_seen=r.last_seen.isoformat() if hasattr(r.last_seen, "isoformat") else str(r.last_seen),
            total_bytes=r.total_bytes, total_packets=r.total_packets,
            protocols=json.loads(r.protocols) if r.protocols else [],
            status=r.status,
        )
        for r in rows
    ]
    return DeviceList(devices=devices, total=len(devices), data_source="DB_DEMO")
