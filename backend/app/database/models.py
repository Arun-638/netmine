# =========================================================
# NetMine AI — SQLAlchemy ORM Models
#
# TABLES:
#   traffic_flows  — captured/classified network flows
#   anomalies      — detected anomaly records
#   devices        — discovered network hosts
#   ml_results     — model training run results
#
# All models import Base from database.base so SQLAlchemy
# uses a single metadata registry for create_all().
# =========================================================
from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Index
from app.database.base import Base


class TrafficFlowDB(Base):
    """One network flow (5-tuple + stats + ML label)."""
    __tablename__ = "traffic_flows"

    id          = Column(String(64),  primary_key=True, index=True)
    timestamp   = Column(DateTime(timezone=True), nullable=False, index=True,
                         default=lambda: datetime.now(timezone.utc))
    src_ip      = Column(String(45),  nullable=False, index=True)
    dst_ip      = Column(String(45),  nullable=False, index=True)
    src_port    = Column(Integer,     nullable=False)
    dst_port    = Column(Integer,     nullable=False, index=True)
    protocol    = Column(String(10),  nullable=False, index=True)
    bytes       = Column(Integer,     nullable=False, default=0)
    packets     = Column(Integer,     nullable=False, default=0)
    duration    = Column(Float,       nullable=False, default=0.0)
    label       = Column(String(64),  nullable=False, default="UNKNOWN", index=True)
    confidence  = Column(Float,       nullable=False, default=0.0)
    data_source = Column(String(20),  nullable=False, default="DEMO")

    __table_args__ = (
        Index("ix_flows_timestamp_label", "timestamp", "label"),
        Index("ix_flows_src_dst",         "src_ip",    "dst_ip"),
    )

    def __repr__(self) -> str:
        return f"<TrafficFlow {self.id} {self.label}>"


class AnomalyDB(Base):
    """Detected anomaly event."""
    __tablename__ = "anomalies"

    id          = Column(String(64),  primary_key=True, index=True)
    timestamp   = Column(DateTime(timezone=True), nullable=False, index=True,
                         default=lambda: datetime.now(timezone.utc))
    src_ip      = Column(String(45),  nullable=False)
    dst_ip      = Column(String(45),  nullable=False)
    type        = Column(String(64),  nullable=False, index=True)
    severity    = Column(String(16),  nullable=False, index=True)
    score       = Column(Float,       nullable=False, default=0.0)
    description = Column(Text,        nullable=False, default="")
    status      = Column(String(20),  nullable=False, default="active", index=True)

    __table_args__ = (
        Index("ix_anomalies_severity_status", "severity", "status"),
    )

    def __repr__(self) -> str:
        return f"<Anomaly {self.id} [{self.severity}] {self.type}>"


class DeviceDB(Base):
    """Network host discovered from traffic."""
    __tablename__ = "devices"

    id            = Column(String(64),  primary_key=True, index=True)
    ip            = Column(String(45),  nullable=False, unique=True, index=True)
    mac           = Column(String(20),  nullable=True)
    hostname      = Column(String(256), nullable=True)
    first_seen    = Column(DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))
    last_seen     = Column(DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))
    total_bytes   = Column(Integer,     nullable=False, default=0)
    total_packets = Column(Integer,     nullable=False, default=0)
    protocols     = Column(Text,        nullable=False, default="[]")  # JSON list
    status        = Column(String(20),  nullable=False, default="active", index=True)

    def __repr__(self) -> str:
        return f"<Device {self.ip} [{self.status}]>"


class MLResultDB(Base):
    """One ML training run record."""
    __tablename__ = "ml_results"

    id          = Column(Integer,     primary_key=True, autoincrement=True)
    model_name  = Column(String(64),  nullable=False, index=True)
    run_id      = Column(String(64),  nullable=False, unique=True)
    dataset     = Column(String(64),  nullable=False, default="CICIDS2017")
    accuracy    = Column(Float,       nullable=False, default=0.0)
    precision   = Column(Float,       nullable=False, default=0.0)
    recall      = Column(Float,       nullable=False, default=0.0)
    f1_score    = Column(Float,       nullable=False, default=0.0)
    trained_at  = Column(DateTime(timezone=True), nullable=False,
                         default=lambda: datetime.now(timezone.utc))
    model_path  = Column(String(512), nullable=True)
    notes       = Column(Text,        nullable=True)

    def __repr__(self) -> str:
        return f"<MLResult {self.model_name} acc={self.accuracy:.4f}>"
