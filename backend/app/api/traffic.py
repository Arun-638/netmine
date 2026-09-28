# =========================================================
# NetMine AI — /api/traffic
#
# What it does:
#   Returns traffic flows and statistics.
#   Supports filtering by label and protocol.
#
# Try it:
#   GET /api/traffic/flows
#   GET /api/traffic/flows?label=PortScan
#   GET /api/traffic/statistics
# =========================================================
from fastapi import APIRouter, Query
from typing import Optional
from app.schemas import TrafficFlowList, ProtocolStat
from app.services.mock_data import DEMO_FLOWS, DEMO_PROTOCOLS

router = APIRouter(prefix="/api/traffic", tags=["Traffic"])


@router.get("/flows", response_model=TrafficFlowList, summary="Get traffic flows")
async def get_flows(
    label:    Optional[str] = Query(None, description="Filter by label (e.g. BENIGN, PortScan)"),
    protocol: Optional[str] = Query(None, description="Filter by protocol (TCP, UDP, ICMP)"),
    limit:    int            = Query(50,  description="Maximum number of flows to return"),
) -> TrafficFlowList:
    """
    Returns recent traffic flows.
    - Supports filtering by label and protocol.
    - Data source: DEMO until Phase 9 live capture.
    """
    flows = DEMO_FLOWS
    if label:
        flows = [f for f in flows if f.label.lower() == label.lower()]
    if protocol:
        flows = [f for f in flows if f.protocol.upper() == protocol.upper()]
    flows = flows[:limit]
    return TrafficFlowList(
        flows=flows,
        total=len(flows),
        data_source="DEMO",
    )


@router.get("/statistics", response_model=list[ProtocolStat], summary="Protocol statistics")
async def get_statistics() -> list[ProtocolStat]:
    """
    Returns packet and byte counts per protocol.
    Data source: DEMO until Phase 9.
    """
    return DEMO_PROTOCOLS
