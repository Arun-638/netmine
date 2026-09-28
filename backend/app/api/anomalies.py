from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas import AnomalyList, Anomaly
from app.services import db_service

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])


@router.get("", response_model=AnomalyList, summary="Get anomalies from database")
async def get_anomalies(
    severity: Optional[str] = Query(None, description="Filter: low|medium|high|critical"),
    status:   Optional[str] = Query(None, description="Filter: active|investigating|resolved"),
    db: Session = Depends(get_db),
) -> AnomalyList:
    """
    Returns anomaly records from SQLite.
    Phase 4: Demo anomalies seeded on startup.
    Phase 7: Real Isolation Forest scores will replace these.
    """
    rows = db_service.get_anomalies(db, severity=severity, status=status)
    anomalies = [
        Anomaly(
            id=r.id,
            timestamp=r.timestamp.isoformat() if hasattr(r.timestamp, "isoformat") else str(r.timestamp),
            src_ip=r.src_ip, dst_ip=r.dst_ip, type=r.type,
            severity=r.severity, score=r.score,
            description=r.description, status=r.status,
        )
        for r in rows
    ]
    active_count = db_service.count_active_anomalies(db)
    return AnomalyList(anomalies=anomalies, total=len(anomalies), active_count=active_count, data_source="DB_DEMO")
