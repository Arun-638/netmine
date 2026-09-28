from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas import DashboardResponse
from app.services import db_service
from app.services.mock_data import DEMO_TREND, DEMO_PROTOCOLS, DEMO_STATUS

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse, summary="Dashboard summary — DB-backed metrics")
async def get_dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
    """
    Returns the full dashboard payload with live DB metrics.
    - metrics: computed from real DB counts (flows, anomalies, devices)
    - traffic_trend: demo 24h trend (Phase 9 will replace)
    - protocol_distribution: aggregated from DB
    - system_status: capture status (Phase 9 will update)
    """
    metrics      = db_service.get_dashboard_metrics(db)
    proto_stats  = db_service.get_protocol_stats(db)

    return DashboardResponse(
        metrics=metrics,
        traffic_trend=DEMO_TREND,
        protocol_distribution=proto_stats if proto_stats else DEMO_PROTOCOLS,
        system_status=DEMO_STATUS,
        data_source="DB_DEMO",
    )
