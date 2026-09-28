from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas import TrafficFlowList, ProtocolStat, TrafficFlow
from app.services import db_service
from app.services.mock_data import DEMO_PROTOCOLS, DEMO_TREND
from app.schemas import TrafficTrendPoint

router = APIRouter(prefix="/api/traffic", tags=["Traffic"])


@router.get("/flows", response_model=TrafficFlowList, summary="Get traffic flows from database")
async def get_flows(
    label:    Optional[str] = Query(None, description="Filter by label (e.g. BENIGN, PortScan)"),
    protocol: Optional[str] = Query(None, description="Filter by protocol (TCP, UDP, ICMP)"),
    limit:    int            = Query(50,   description="Max flows to return", ge=1, le=500),
    db: Session = Depends(get_db),
) -> TrafficFlowList:
    """
    Returns recent traffic flows from SQLite.
    - Phase 4: Queries the database (demo data seeded on startup).
    - Phase 9: Live TShark data will be inserted in real-time.
    """
    rows = db_service.get_flows(db, label=label, protocol=protocol, limit=limit)
    flows = [
        TrafficFlow(
            id=r.id,
            timestamp=r.timestamp.isoformat() if hasattr(r.timestamp, "isoformat") else str(r.timestamp),
            src_ip=r.src_ip, dst_ip=r.dst_ip,
            src_port=r.src_port, dst_port=r.dst_port,
            protocol=r.protocol, bytes=r.bytes, packets=r.packets,
            duration=r.duration, label=r.label, confidence=r.confidence,
        )
        for r in rows
    ]
    return TrafficFlowList(flows=flows, total=len(flows), data_source="DB_DEMO")


@router.get("/statistics", response_model=list[ProtocolStat], summary="Protocol statistics from DB")
async def get_statistics(db: Session = Depends(get_db)) -> list[ProtocolStat]:
    """Protocol packet/byte counts aggregated from the traffic_flows table."""
    stats = db_service.get_protocol_stats(db)
    return stats if stats else DEMO_PROTOCOLS


@router.get("/trend", response_model=list[TrafficTrendPoint], summary="24h traffic trend")
async def get_trend() -> list[TrafficTrendPoint]:
    """
    Returns 24-hour traffic trend.
    Phase 4: Returns demo trend data.
    Phase 9: Will aggregate from DB by hour.
    """
    return DEMO_TREND
