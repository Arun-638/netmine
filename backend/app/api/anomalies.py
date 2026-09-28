# =========================================================
# NetMine AI — /api/anomalies
#
# What it does:
#   Returns detected anomalies.
#   Supports filtering by severity and status.
#
# Try it:
#   GET /api/anomalies
#   GET /api/anomalies?severity=high
#   GET /api/anomalies?status=active
# =========================================================
from fastapi import APIRouter, Query
from typing import Optional
from app.schemas import AnomalyList
from app.services.mock_data import DEMO_ANOMALIES

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])


@router.get("", response_model=AnomalyList, summary="Get anomalies")
async def get_anomalies(
    severity: Optional[str] = Query(None, description="Filter by severity: low|medium|high|critical"),
    status:   Optional[str] = Query(None, description="Filter by status: active|investigating|resolved"),
) -> AnomalyList:
    """
    Returns detected anomalies.
    - Filterable by severity and status.
    - Data source: DEMO until Isolation Forest is trained (Phase 7).
    - ⚠ NOT YET EVALUATED: all scores are demo values.
    """
    anomalies = DEMO_ANOMALIES
    if severity:
        anomalies = [a for a in anomalies if a.severity == severity.lower()]
    if status:
        anomalies = [a for a in anomalies if a.status == status.lower()]

    active_count = sum(1 for a in DEMO_ANOMALIES if a.status == "active")

    return AnomalyList(
        anomalies=anomalies,
        total=len(anomalies),
        active_count=active_count,
        data_source="DEMO",
    )
