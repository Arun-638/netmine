# =========================================================
# NetMine AI — Pydantic Response Schemas
#
# WHY PYDANTIC:
#   Pydantic validates and serializes data automatically.
#   FastAPI uses these schemas to generate OpenAPI docs
#   and to ensure type safety on the API boundary.
#
# These schemas mirror the TypeScript types in:
#   frontend/src/types/index.ts
# =========================================================
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ── System / Health ────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    timestamp: str

    model_config = {"from_attributes": True}


class SystemStatus(BaseModel):
    capture_active: bool = False
    capture_rate: float = 0.0          # pkt/s
    processing_rate: float = 0.0       # flows/s
    queue_size: int = 0
    dropped_packets: int = 0
    processing_latency_ms: float = 0.0
    uptime: str = "00:00:00"
    data_source: Literal["LIVE", "DEMO", "FILE"] = "DEMO"


# ── Traffic Flow ───────────────────────────────────────────
class TrafficFlow(BaseModel):
    id: str
    timestamp: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    bytes: int
    packets: int
    duration: float
    label: str
    confidence: float


class TrafficFlowList(BaseModel):
    flows: list[TrafficFlow]
    total: int
    data_source: str = "DEMO"


# ── Anomaly ────────────────────────────────────────────────
class Anomaly(BaseModel):
    id: str
    timestamp: str
    src_ip: str
    dst_ip: str
    type: str
    severity: Literal["low", "medium", "high", "critical"]
    score: float = Field(ge=0.0, le=1.0)
    description: str
    status: Literal["active", "resolved", "investigating"]


class AnomalyList(BaseModel):
    anomalies: list[Anomaly]
    total: int
    active_count: int
    data_source: str = "DEMO"


# ── Device ─────────────────────────────────────────────────
class Device(BaseModel):
    id: str
    ip: str
    mac: Optional[str] = None
    hostname: Optional[str] = None
    first_seen: str
    last_seen: str
    total_bytes: int
    total_packets: int
    protocols: list[str]
    status: Literal["active", "inactive", "suspicious"]


class DeviceList(BaseModel):
    devices: list[Device]
    total: int
    data_source: str = "DEMO"


# ── Protocol Statistics ────────────────────────────────────
class ProtocolStat(BaseModel):
    protocol: str
    packets: int
    bytes: int
    percentage: float


# ── Traffic Trend ──────────────────────────────────────────
class TrafficTrendPoint(BaseModel):
    time: str
    packets_per_sec: float
    bytes_per_sec: float
    anomalies: int


# ── Dashboard Summary ──────────────────────────────────────
class DashboardMetric(BaseModel):
    id: str
    title: str
    value: str
    unit: Optional[str] = None
    change: Optional[float] = None
    trend: Optional[Literal["up", "down", "neutral"]] = None


class DashboardResponse(BaseModel):
    metrics: list[DashboardMetric]
    traffic_trend: list[TrafficTrendPoint]
    protocol_distribution: list[ProtocolStat]
    system_status: SystemStatus
    data_source: str = "DEMO"


# ── DBSCAN Cluster ─────────────────────────────────────────
class Cluster(BaseModel):
    id: int                  # -1 = noise
    label: str
    size: int
    description: str
    avg_packets: float
    avg_bytes: float
    color: Optional[str] = None


class ClusterList(BaseModel):
    clusters: list[Cluster]
    total_flows: int
    noise_count: int
    algorithm: str = "DBSCAN"
    status: Literal["trained", "not_trained"] = "not_trained"
    data_source: str = "DEMO"


# ── Association Rule ───────────────────────────────────────
class AssociationRule(BaseModel):
    id: str
    antecedent: list[str]
    consequent: list[str]
    support: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    lift: float


class AssociationRuleList(BaseModel):
    rules: list[AssociationRule]
    total: int
    algorithm: str = "Apriori"
    min_support: float = 0.01
    min_confidence: float = 0.5
    status: Literal["trained", "not_trained"] = "not_trained"
    data_source: str = "DEMO"


# ── ML Metrics ─────────────────────────────────────────────
class MLModelMetrics(BaseModel):
    model: str
    accuracy: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    status: Literal["trained", "not_trained", "training"] = "not_trained"
    trained_at: Optional[str] = None
    dataset: Optional[str] = None


class MLMetricsList(BaseModel):
    models: list[MLModelMetrics]
    best_model: Optional[str] = None
    data_source: str = "NOT_YET_EVALUATED"
    train_rows: Optional[int] = None
    train_rows_raw: Optional[int] = None
    resampling: Optional[dict] = None


# ── Live Capture Controls ──────────────────────────────────
class CaptureStartRequest(BaseModel):
    interface: Optional[str] = None      # e.g. "Wi-Fi", "Ethernet"
    packet_count: Optional[int] = None   # None = unlimited


class CaptureStatusResponse(BaseModel):
    active: bool
    interface: Optional[str] = None
    packets_captured: int = 0
    duration_seconds: float = 0.0
    message: str = "NOT IMPLEMENTED — Phase 9"

