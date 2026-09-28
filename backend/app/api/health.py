from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.schemas import HealthResponse, SystemStatus
from app.services.mock_data import DEMO_STATUS
from app.database.session import get_db
from app.core.config import settings

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("", response_model=HealthResponse, summary="Server health check")
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/status", response_model=SystemStatus, summary="System and capture status")
async def system_status() -> SystemStatus:
    return DEMO_STATUS


@router.get("/db", summary="Database connectivity check")
async def db_check(db: Session = Depends(get_db)) -> dict:
    """Verifies SQLite is accessible and returns table row counts."""
    try:
        flows     = db.execute(text("SELECT COUNT(*) FROM traffic_flows")).scalar()
        anomalies = db.execute(text("SELECT COUNT(*) FROM anomalies")).scalar()
        devices   = db.execute(text("SELECT COUNT(*) FROM devices")).scalar()
        return {
            "status":   "ok",
            "database": "SQLite",
            "tables": {
                "traffic_flows": flows,
                "anomalies":     anomalies,
                "devices":       devices,
            },
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}
