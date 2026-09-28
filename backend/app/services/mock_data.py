# =========================================================
# NetMine AI — Backend Mock / Demo Data
#
# These are the server-side equivalents of the frontend
# mock data in frontend/src/mock/data.ts
#
# They will be replaced in later phases:
#   Phase 4 → database queries replace these lists
#   Phase 6 → real ML metrics replace MLModelMetrics
#   Phase 7 → real cluster/rule data
#   Phase 9 → real TShark live data
# =========================================================
from app.schemas import (
    DashboardMetric, TrafficTrendPoint, ProtocolStat, SystemStatus,
    TrafficFlow, Anomaly, Device, Cluster, AssociationRule, MLModelMetrics,
)
import random
import math

# ── System status ──────────────────────────────────────────
DEMO_STATUS = SystemStatus(
    capture_active=False,
    capture_rate=0.0,
    processing_rate=0.0,
    queue_size=0,
    dropped_packets=0,
    processing_latency_ms=0.0,
    uptime="00:00:00",
    data_source="DEMO",
)

# ── Dashboard metrics ──────────────────────────────────────
DEMO_METRICS = [
    DashboardMetric(id="total-packets",  title="Total Packets",    value="2,847,392", unit="pkts",  change=12.4,  trend="up"),
    DashboardMetric(id="total-bytes",    title="Total Bytes",      value="18.3",      unit="GB",    change=8.7,   trend="up"),
    DashboardMetric(id="packets-sec",    title="Packets / sec",    value="1,247",     unit="pkt/s", change=-3.2,  trend="down"),
    DashboardMetric(id="active-devices", title="Active Devices",   value="42",        unit="hosts", change=2.1,   trend="up"),
    DashboardMetric(id="anomalies",      title="Active Anomalies", value="7",         unit="alerts",change=-12.0, trend="down"),
    DashboardMetric(id="net-health",     title="Network Health",   value="94",        unit="%",     change=1.5,   trend="up"),
]

# ── Traffic trend (24h) ────────────────────────────────────
def _make_trend() -> list[TrafficTrendPoint]:
    points = []
    for i in range(24):
        base = 800 + (600 if 8 < i < 18 else 0)
        points.append(TrafficTrendPoint(
            time=f"{i:02d}:00",
            packets_per_sec=float(int(base + random.random() * 800)),
            bytes_per_sec=float(int(500_000 + random.random() * 1_000_000)),
            anomalies=int(random.random() * (12 if i == 14 else 3)),
        ))
    return points

DEMO_TREND = _make_trend()

# ── Protocol distribution ──────────────────────────────────
DEMO_PROTOCOLS = [
    ProtocolStat(protocol="TCP",   packets=1_823_000, bytes=12_400_000_000, percentage=64.0),
    ProtocolStat(protocol="UDP",   packets=712_000,   bytes=3_200_000_000,  percentage=25.0),
    ProtocolStat(protocol="ICMP",  packets=198_000,   bytes=320_000_000,    percentage=7.0),
    ProtocolStat(protocol="DNS",   packets=82_000,    bytes=180_000_000,    percentage=3.0),
    ProtocolStat(protocol="Other", packets=32_000,    bytes=40_000_000,     percentage=1.0),
]

# ── Traffic flows ──────────────────────────────────────────
DEMO_FLOWS = [
    TrafficFlow(id="f1", timestamp="2026-09-28T05:00:01Z", src_ip="192.168.1.10", dst_ip="8.8.8.8",       src_port=54231, dst_port=53,   protocol="UDP",  bytes=248,    packets=2,  duration=0.10, label="BENIGN",    confidence=0.98),
    TrafficFlow(id="f2", timestamp="2026-09-28T05:00:03Z", src_ip="192.168.1.22", dst_ip="104.18.22.1",   src_port=49812, dst_port=443,  protocol="TCP",  bytes=18432,  packets=24, duration=2.40, label="BENIGN",    confidence=0.97),
    TrafficFlow(id="f3", timestamp="2026-09-28T05:00:07Z", src_ip="10.0.0.5",     dst_ip="192.168.1.1",   src_port=12340, dst_port=80,   protocol="TCP",  bytes=2048,   packets=8,  duration=0.80, label="PortScan",  confidence=0.89),
    TrafficFlow(id="f4", timestamp="2026-09-28T05:00:12Z", src_ip="192.168.1.33", dst_ip="172.217.0.1",   src_port=58901, dst_port=443,  protocol="TCP",  bytes=104857, packets=88, duration=5.20, label="BENIGN",    confidence=0.96),
    TrafficFlow(id="f5", timestamp="2026-09-28T05:00:15Z", src_ip="10.0.0.99",    dst_ip="192.168.1.100", src_port=65432, dst_port=22,   protocol="TCP",  bytes=512,    packets=4,  duration=0.20, label="SSHBrute",  confidence=0.82),
    TrafficFlow(id="f6", timestamp="2026-09-28T05:00:18Z", src_ip="192.168.1.5",  dst_ip="1.1.1.1",       src_port=52201, dst_port=53,   protocol="UDP",  bytes=180,    packets=1,  duration=0.05, label="BENIGN",    confidence=0.99),
    TrafficFlow(id="f7", timestamp="2026-09-28T05:00:22Z", src_ip="192.168.1.88", dst_ip="192.168.1.1",   src_port=34567, dst_port=3389, protocol="TCP",  bytes=1024,   packets=6,  duration=0.50, label="RDPAttack", confidence=0.77),
    TrafficFlow(id="f8", timestamp="2026-09-28T05:00:30Z", src_ip="192.168.1.77", dst_ip="216.58.0.1",    src_port=56712, dst_port=80,   protocol="TCP",  bytes=32768,  packets=32, duration=3.10, label="BENIGN",    confidence=0.95),
]

# ── Anomalies ──────────────────────────────────────────────
DEMO_ANOMALIES = [
    Anomaly(id="a1", timestamp="2026-09-28T04:58:12Z", src_ip="10.0.0.5",     dst_ip="192.168.1.1",   type="Port Scan",           severity="high",     score=0.91, description="Sequential port scanning detected across 128 ports.",               status="active"),
    Anomaly(id="a2", timestamp="2026-09-28T05:00:15Z", src_ip="10.0.0.99",    dst_ip="192.168.1.100", type="SSH Brute Force",     severity="high",     score=0.87, description="Repeated SSH login attempts — 47 failures in 60 seconds.",          status="investigating"),
    Anomaly(id="a3", timestamp="2026-09-28T05:00:22Z", src_ip="192.168.1.88", dst_ip="192.168.1.1",   type="Unusual RDP",         severity="medium",   score=0.76, description="RDP connection attempt from internal host at unusual hour.",         status="active"),
    Anomaly(id="a4", timestamp="2026-09-28T03:12:04Z", src_ip="172.16.0.200", dst_ip="10.0.0.1",      type="Large Data Transfer", severity="medium",   score=0.68, description="Unusually large outbound transfer (>2 GB in 5 minutes).",           status="resolved"),
    Anomaly(id="a5", timestamp="2026-09-28T02:44:33Z", src_ip="192.168.1.50", dst_ip="185.10.5.22",   type="Suspicious DNS",      severity="low",      score=0.55, description="DNS queries to known DGA-pattern domains.",                         status="resolved"),
    Anomaly(id="a6", timestamp="2026-09-28T04:30:10Z", src_ip="10.0.0.77",    dst_ip="192.168.1.255", type="Broadcast Flood",     severity="critical", score=0.94, description="High-volume broadcast traffic consistent with network flooding.",   status="active"),
    Anomaly(id="a7", timestamp="2026-09-28T05:01:00Z", src_ip="192.168.1.15", dst_ip="10.0.0.88",     type="ICMP Tunnel",         severity="medium",   score=0.71, description="Anomalous ICMP payload sizes suggesting covert channel usage.",     status="investigating"),
]

# ── Devices ────────────────────────────────────────────────
DEMO_DEVICES = [
    Device(id="d1", ip="192.168.1.1",   hostname="gateway",          first_seen="2026-09-28T00:00:01Z", last_seen="2026-09-28T05:02:00Z", total_bytes=4_294_967_296, total_packets=3_200_000, protocols=["TCP","UDP","ICMP"], status="active"),
    Device(id="d2", ip="192.168.1.10",  hostname="arun-laptop",      first_seen="2026-09-28T00:01:00Z", last_seen="2026-09-28T05:01:55Z", total_bytes=1_073_741_824, total_packets=820_000,   protocols=["TCP","UDP"],        status="active"),
    Device(id="d3", ip="192.168.1.22",  hostname="desktop-adithyan", first_seen="2026-09-28T00:02:10Z", last_seen="2026-09-28T05:01:44Z", total_bytes=536_870_912,   total_packets=420_000,   protocols=["TCP"],              status="active"),
    Device(id="d4", ip="10.0.0.5",      hostname="unknown",          first_seen="2026-09-28T04:55:00Z", last_seen="2026-09-28T05:00:10Z", total_bytes=65_536,        total_packets=512,       protocols=["TCP"],              status="suspicious"),
    Device(id="d5", ip="10.0.0.99",     hostname="unknown",          first_seen="2026-09-28T05:00:10Z", last_seen="2026-09-28T05:00:20Z", total_bytes=32_768,        total_packets=128,       protocols=["TCP"],              status="suspicious"),
    Device(id="d6", ip="192.168.1.33",  hostname="vaishnav-pc",      first_seen="2026-09-28T00:10:00Z", last_seen="2026-09-28T05:01:30Z", total_bytes=268_435_456,   total_packets=210_000,   protocols=["TCP","UDP"],        status="active"),
]

# ── DBSCAN Clusters ────────────────────────────────────────
DEMO_CLUSTERS = [
    Cluster(id=0,  label="Normal Web Traffic",   size=12_420, description="HTTP/HTTPS flows to common CDN and web services.",                  avg_packets=35.0,  avg_bytes=45_000.0,    color="#22c55e"),
    Cluster(id=1,  label="DNS/NTP Background",   size=8_200,  description="Periodic short UDP flows — background resolution and time sync.",    avg_packets=2.0,   avg_bytes=320.0,       color="#3b82f6"),
    Cluster(id=2,  label="Bulk Data Transfers",  size=3_840,  description="Long-duration, high-volume TCP flows consistent with file downloads.",avg_packets=880.0, avg_bytes=1_200_000.0, color="#8b5cf6"),
    Cluster(id=3,  label="Interactive Sessions", size=2_110,  description="SSH and RDP-sized flows with regular inter-packet timing.",           avg_packets=62.0,  avg_bytes=28_000.0,    color="#f59e0b"),
    Cluster(id=-1, label="Anomalous (Noise)",    size=312,    description="Flows that do not fit any cluster. Requires further investigation.",  avg_packets=180.0, avg_bytes=750.0,       color="#ef4444"),
]

# ── Association Rules ──────────────────────────────────────
DEMO_RULES = [
    AssociationRule(id="r1", antecedent=["dstPort=80"],                        consequent=["protocol=TCP","label=BENIGN"], support=0.42, confidence=0.91, lift=1.8),
    AssociationRule(id="r2", antecedent=["dstPort=443"],                       consequent=["protocol=TCP","label=BENIGN"], support=0.38, confidence=0.95, lift=1.9),
    AssociationRule(id="r3", antecedent=["dstPort=22","shortDuration=true"],   consequent=["label=SSHBrute"],              support=0.02, confidence=0.83, lift=12.4),
    AssociationRule(id="r4", antecedent=["highPackets=true","dstPort=80"],     consequent=["label=DDoS"],                  support=0.01, confidence=0.79, lift=18.2),
    AssociationRule(id="r5", antecedent=["dstPort=53","udp=true"],             consequent=["label=BENIGN"],                support=0.14, confidence=0.97, lift=1.2),
    AssociationRule(id="r6", antecedent=["scanPorts=true"],                    consequent=["label=PortScan"],              support=0.03, confidence=0.88, lift=15.7),
]

# ── ML Metrics (placeholder — NOT YET EVALUATED) ──────────
DEMO_ML_METRICS = [
    MLModelMetrics(model="Decision Tree", accuracy=0.0, precision=0.0, recall=0.0, f1_score=0.0, status="not_trained"),
    MLModelMetrics(model="Random Forest", accuracy=0.0, precision=0.0, recall=0.0, f1_score=0.0, status="not_trained"),
    MLModelMetrics(model="XGBoost",       accuracy=0.0, precision=0.0, recall=0.0, f1_score=0.0, status="not_trained"),
]
