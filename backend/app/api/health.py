# =========================================================
# NetMine AI — /api/health
#
# What it does:
#   Returns server status, version, and timestamp.
#   Used as a heartbeat by the frontend.
#
# Try it: GET http://localhost:8000/api/health
# =========================================================
from fastapi import APIRouter
from datetime import datetime, timezone
from app.schemas import HealthResponse, SystemStatus
from app.services.mock_data import DEMO_STATUS
from app.core.config import settings

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("", response_model=HealthResponse, summary="Server health check")
async def health_check() -> HealthResponse:
    """
    Returns:
    - status: "ok" if server is running
    - version: app version string
    - timestamp: current UTC ISO timestamp
    """
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/status", response_model=SystemStatus, summary="Capture and processing status")
async def system_status() -> SystemStatus:
    """
    Returns real-time capture metrics.
    Currently returns DEMO values — will connect to
    the TShark capture process in Phase 9.
    """
    return DEMO_STATUS
