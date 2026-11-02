# =========================================================
# NetMine AI — /api/devices
#
# Wi-Fi Network Inspector & Device Discovery API
# Real-time discovery of devices connected to the same Wi-Fi
# network (inspired by Avast Network Inspector).
# =========================================================
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import DeviceDB
from app.services.wifi_discovery import (
    get_wifi_network_info,
    scan_wifi_network,
    get_vendor,
)
from packet_capture.capture_engine import LiveCaptureEngine

router = APIRouter(prefix="/api/devices", tags=["Devices"])
engine = LiveCaptureEngine.get_instance()


def _format_db_device(row: DeviceDB) -> Dict[str, Any]:
    """Helper to convert a DeviceDB row into a rich Wi-Fi device object."""
    meta = {}
    try:
        if row.protocols:
            meta = json.loads(row.protocols)
            if not isinstance(meta, dict):
                meta = {"protocols": meta}
    except Exception:
        meta = {}

    ports = meta.get("ports", [])
    category = meta.get("category", "network")
    device_type = meta.get("device_type", "Connected Wi-Fi Device")
    vendor = meta.get("vendor", get_vendor(row.mac or ""))
    is_this_device = meta.get("is_this_device", False)
    is_gateway = meta.get("is_gateway", False)
    security_status = meta.get("security_status", "Protected")

    return {
        "id": row.id,
        "ip": row.ip,
        "mac": row.mac or "--:--:--:--:--:--",
        "hostname": row.hostname or row.ip,
        "vendor": vendor,
        "category": category,
        "device_type": device_type,
        "is_this_device": is_this_device,
        "is_gateway": is_gateway,
        "ports": ports,
        "protocols": [f"Port {p}" for p in ports] if ports else ["Wi-Fi"],
        "total_bytes": row.total_bytes or 0,
        "total_packets": row.total_packets or 0,
        "last_seen": row.last_seen.isoformat() if row.last_seen else "",
        "first_seen": row.first_seen.isoformat() if row.first_seen else "",
        "status": row.status or "active",
        "security_status": security_status,
        "is_local": True,
    }


def _sync_scanned_devices_to_db(devices: List[Dict[str, Any]], db: Session):
    """Saves or updates discovered Wi-Fi devices in SQLite."""
    now = datetime.now(timezone.utc)
    for d in devices:
        existing = db.query(DeviceDB).filter(DeviceDB.ip == d["ip"]).first()
        metadata_json = json.dumps({
            "vendor": d.get("vendor", ""),
            "category": d.get("category", "network"),
            "device_type": d.get("device_type", "Connected Wi-Fi Device"),
            "is_this_device": d.get("is_this_device", False),
            "is_gateway": d.get("is_gateway", False),
            "ports": d.get("ports", []),
            "security_status": d.get("security_status", "Protected"),
        })

        if existing:
            existing.mac = d.get("mac", existing.mac)
            existing.hostname = d.get("hostname", existing.hostname)
            existing.last_seen = now
            existing.protocols = metadata_json
            existing.status = d.get("status", "active")
        else:
            new_dev = DeviceDB(
                id=d["id"],
                ip=d["ip"],
                mac=d.get("mac", "--:--:--:--:--:--"),
                hostname=d.get("hostname", d["ip"]),
                first_seen=now,
                last_seen=now,
                total_bytes=d.get("total_bytes", 0),
                total_packets=d.get("total_packets", 0),
                protocols=metadata_json,
                status=d.get("status", "active"),
            )
            db.add(new_dev)
    try:
        db.commit()
    except Exception:
        db.rollback()


@router.get("", summary="Get Wi-Fi network inspector devices")
async def get_devices(
    category: Optional[str] = Query(None, description="Filter: router|computer|mobile|smart_home|network"),
    db: Session = Depends(get_db),
) -> dict:
    """
    Returns devices connected to the same Wi-Fi network (Avast Network Inspector style).
    If no devices have been saved, automatically runs a discovery scan.
    """
    net_info = get_wifi_network_info()

    # Query existing devices in DB
    rows = db.query(DeviceDB).all()

    # If DB is empty, run an initial scan of the Wi-Fi network
    if not rows:
        scan_res = scan_wifi_network()
        _sync_scanned_devices_to_db(scan_res["devices"], db)
        rows = db.query(DeviceDB).all()

    devices = [_format_db_device(r) for r in rows]

    # Filter by category if requested
    if category:
        devices = [d for d in devices if d.get("category", "").lower() == category.lower()]

    # Sort: Gateway first, This PC second, then router, computer, smart_home, mobile, network
    def sort_key(d):
        if d.get("is_gateway"):
            return 0
        if d.get("is_this_device"):
            return 1
        cat_order = {"router": 2, "computer": 3, "smart_home": 4, "mobile": 5, "network": 6}
        return cat_order.get(d.get("category", ""), 7)

    devices.sort(key=sort_key)

    return {
        "network": net_info,
        "devices": devices,
        "total": len(devices),
        "data_source": "WIFI_DISCOVERY",
    }


@router.post("/scan", summary="Scan Wi-Fi network for connected devices")
async def scan_devices(db: Session = Depends(get_db)) -> dict:
    """
    Actively sweeps the local Wi-Fi subnet to discover all currently connected devices.
    """
    scan_res = scan_wifi_network()
    _sync_scanned_devices_to_db(scan_res["devices"], db)

    rows = db.query(DeviceDB).all()
    devices = [_format_db_device(r) for r in rows]

    def sort_key(d):
        if d.get("is_gateway"):
            return 0
        if d.get("is_this_device"):
            return 1
        cat_order = {"router": 2, "computer": 3, "smart_home": 4, "mobile": 5, "network": 6}
        return cat_order.get(d.get("category", ""), 7)

    devices.sort(key=sort_key)

    return {
        "network": scan_res["network"],
        "devices": devices,
        "total": len(devices),
        "data_source": "WIFI_DISCOVERY",
        "scanned_at": scan_res.get("scanned_at", ""),
    }


@router.get("/network", summary="Get active Wi-Fi network information")
async def get_network() -> dict:
    """Returns active Wi-Fi SSID, Gateway, Adapter, and IP configuration."""
    return {"network": get_wifi_network_info()}


@router.post("/clear", summary="Clear all discovered devices")
@router.delete("", summary="Clear all discovered devices")
async def clear_devices(db: Session = Depends(get_db)) -> dict:
    """Clears both in-memory live devices and DB device records."""
    with engine.lock:
        engine._live_devices.clear()
        engine._ip_mac_map.clear()

    deleted = db.query(DeviceDB).delete()
    db.commit()

    return {
        "status": "cleared",
        "deleted_records": deleted,
        "message": "All devices cleared from memory and database",
    }
