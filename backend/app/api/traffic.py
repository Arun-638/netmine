from fastapi import APIRouter, Query
from typing import Optional
from packet_capture.capture_engine import LiveCaptureEngine
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database.session import get_db
from app.services import db_service
from app.schemas import TrafficFlow, TrafficFlowList

router = APIRouter(prefix="/api/traffic", tags=["Traffic"])
engine = LiveCaptureEngine.get_instance()


@router.get("/flows", summary="Get recent traffic flows (live then DB fallback)")
async def get_flows(
    label:    Optional[str] = Query(None, description="Filter by label (e.g. BENIGN, PortScan)"),
    protocol: Optional[str] = Query(None, description="Filter by protocol (TCP, UDP, ICMP)"),
    limit:    int            = Query(50,   description="Max flows to return", ge=1, le=500),
    db: Session = Depends(get_db),
) -> dict:
    """
    Returns recent traffic flows.
    Priority: live capture engine ring buffer → DB fallback.
    No demo data.
    """
    live_flows = engine.get_recent_flows(limit=limit * 2)
    if label:
        live_flows = [f for f in live_flows if f.get("label", "").lower() == label.lower()]
    if protocol:
        live_flows = [f for f in live_flows if f.get("protocol", "").upper() == protocol.upper()]
    live_flows = live_flows[:limit]

    if live_flows:
        return {
            "flows": live_flows,
            "total": len(live_flows),
            "data_source": "LIVE_CAPTURE" if engine.is_running else "RECENT_CACHE",
        }

    # DB fallback (real inserted flows only)
    rows = db_service.get_flows(db, label=label, protocol=protocol, limit=limit)
    flows = [
        {
            "id": str(r.id),
            "timestamp": r.timestamp.isoformat() if hasattr(r.timestamp, "isoformat") else str(r.timestamp),
            "src_ip": r.src_ip, "dst_ip": r.dst_ip,
            "src_port": r.src_port, "dst_port": r.dst_port,
            "protocol": r.protocol, "bytes": r.bytes, "packets": r.packets,
            "duration": r.duration, "label": r.label, "confidence": r.confidence,
        }
        for r in rows
    ]
    return {
        "flows": flows,
        "total": len(flows),
        "data_source": "DB_LIVE" if flows else "IDLE",
    }


@router.get("/statistics", summary="Protocol statistics from live capture")
async def get_statistics(db: Session = Depends(get_db)) -> list:
    """Protocol packet/byte counts computed from live engine recent_flows, with DB fallback."""
    live_stats = engine.get_live_protocol_stats()
    if live_stats:
        return live_stats

    # DB fallback
    stats = db_service.get_protocol_stats(db)
    return [
        {"protocol": s.protocol, "packets": s.packets, "bytes": s.bytes, "percentage": s.percentage}
        for s in stats
    ]


@router.get("/trend", summary="Live throughput trend (rolling 30 data points)")
async def get_trend() -> list:
    """Returns rolling throughput trend points derived from live capture engine."""
    return engine.get_throughput_history(limit=30)
