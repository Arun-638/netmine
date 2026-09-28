# =========================================================
# NetMine AI — /api/dashboard
#
# What it does:
#   Returns all data needed for the Dashboard page
#   in one single request (avoids multiple round-trips).
#
# Try it: GET http://localhost:8000/api/dashboard
# =========================================================
from fastapi import APIRouter
from app.schemas import DashboardResponse
from app.services.mock_data import (
    DEMO_METRICS, DEMO_TREND, DEMO_PROTOCOLS, DEMO_STATUS
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse, summary="Dashboard summary data")
async def get_dashboard() -> DashboardResponse:
    """
    Returns the full dashboard payload:
    - metrics: 6 KPI cards
    - traffic_trend: 24-hour trend data
    - protocol_distribution: per-protocol breakdown
    - system_status: capture and processing metrics
    - data_source: "DEMO" until Phase 9

    NOTE: All values are DEMO DATA.
    Real data will flow from the database and live capture in Phase 9.
    """
    return DashboardResponse(
        metrics=DEMO_METRICS,
        traffic_trend=DEMO_TREND,
        protocol_distribution=DEMO_PROTOCOLS,
        system_status=DEMO_STATUS,
        data_source="DEMO",
    )
