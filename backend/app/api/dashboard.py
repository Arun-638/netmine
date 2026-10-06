import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas import DashboardResponse, DashboardMetric, SystemStatus, TrafficTrendPoint, ProtocolStat
from app.services import db_service
from packet_capture.capture_engine import LiveCaptureEngine

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
engine = LiveCaptureEngine.get_instance()


@router.get("", response_model=DashboardResponse, summary="Dashboard summary — live capture metrics")
async def get_dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
    """
    Returns the full dashboard payload with live metrics.
    - metrics: from LiveCaptureEngine stats (real-time)
    - traffic_trend: current throughput snapshot
    - protocol_distribution: from live capture ring buffer
    - system_status: reflect actual capture state
    No demo/mock data — all values are real or zero.
    """
    status = engine.get_status()

    def fmt_bytes(b: int) -> tuple[str, str]:
        if b >= 1_000_000_000: return f"{b/1e9:.1f}", "GB"
        if b >= 1_000_000:     return f"{b/1e6:.1f}", "MB"
        if b >= 1_000:         return f"{b/1e3:.1f}", "KB"
        return str(b), "B"

    val_bytes, unit_bytes = fmt_bytes(status["bytes_captured"])
    live_devices = engine.get_live_devices()

    metrics = [
        DashboardMetric(id="total-packets",  title="Total Packets",    value=f"{status['packets_captured']:,}",   unit="pkts"),
        DashboardMetric(id="total-bytes",    title="Total Bytes",      value=val_bytes,                           unit=unit_bytes),
        DashboardMetric(id="packets-sec",    title="Packets/s",        value=str(status["packets_per_sec"]),       unit="pps"),
        DashboardMetric(id="active-devices", title="Live Devices",     value=str(len(live_devices)),              unit="hosts"),
        DashboardMetric(id="anomalies",      title="Threats Detected", value=str(status["attacks_detected"]),     unit="alerts"),
        DashboardMetric(id="net-health",     title="ML Models",        value="Active" if status["models_active"] else "Offline", unit=""),
    ]

    # Protocol distribution from live flows, DB fallback
    live_proto = engine.get_live_protocol_stats()
    if live_proto:
        proto_stats = [ProtocolStat(**p) for p in live_proto]
    else:
        proto_stats = db_service.get_protocol_stats(db) or []

    # Traffic trend — rolling throughput history points for smooth line rendering
    history = engine.get_throughput_history(limit=30)
    traffic_trend: list[TrafficTrendPoint] = [
        TrafficTrendPoint(
            time=h["time"],
            packets_per_sec=h["packets_per_sec"],
            bytes_per_sec=h["bytes_per_sec"],
            anomalies=h["anomalies"],
        )
        for h in history
    ]

    # System status (using only fields that exist in the schema)
    system_status = SystemStatus(
        capture_active=status["active"],
        capture_rate=status["packets_per_sec"],
        data_source="LIVE",
    )

    data_source = "LIVE_CAPTURE" if engine.is_running else ("RECENT_CACHE" if engine.total_packets > 0 else "IDLE")

    return DashboardResponse(
        metrics=metrics,
        traffic_trend=traffic_trend,
        protocol_distribution=proto_stats,
        system_status=system_status,
        data_source=data_source,
    )
