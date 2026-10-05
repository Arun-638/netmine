// =========================================================
// NetMine AI — Dashboard Page
// Real API integration with SQLite DB & fallback to demo data
// =========================================================
import { useState, useEffect } from "react";
import {
  Activity, AlertTriangle, Monitor,
  Wifi, Package, Database, Heart, RefreshCw,
} from "lucide-react";
import MetricCard from "../components/ui/MetricCard";
import TrafficChart from "../charts/TrafficChart";
import ProtocolChart from "../charts/ProtocolChart";
import {
  mockMetricCards,
  mockTrafficTrend,
  mockProtocols,
  mockAnomalies,
  mockFlows,
} from "../mock/data";
import { getApiUrl } from "../services/api";
import type { MetricCardData, Anomaly, TrafficFlow, ProtocolStat, TrafficTrendPoint } from "../types";

// Map metric card ids to icons + colors
const metricIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  "total-packets":  { icon: <Package   size={16} />, color: "#3b82f6" },
  "total-bytes":    { icon: <Database  size={16} />, color: "#06b6d4" },
  "packets-sec":    { icon: <Activity  size={16} />, color: "#8b5cf6" },
  "active-devices": { icon: <Monitor   size={16} />, color: "#22c55e" },
  "anomalies":      { icon: <AlertTriangle size={16} />, color: "#ef4444" },
  "net-health":     { icon: <Heart     size={16} />, color: "#22c55e" },
};

// Severity color helper
function severityClass(s: string) {
  const map: Record<string, string> = {
    critical: "badge badge-critical",
    high:     "badge badge-high",
    medium:   "badge badge-medium",
    low:      "badge badge-low",
  };
  return map[s] ?? "badge";
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    active:        "badge badge-active",
    resolved:      "badge badge-resolved",
    investigating: "badge badge-investigating",
  };
  return map[s] ?? "badge";
}

function labelClass(l: string) {
  if (l === "BENIGN") return "badge badge-benign";
  if (l === "PortScan") return "badge badge-medium";
  if (l.includes("DoS") || l === "DDoS" || l === "Heartbleed") return "badge badge-critical";
  return "badge badge-high";
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricCardData[]>(mockMetricCards);
  const [trafficTrend, setTrafficTrend] = useState<TrafficTrendPoint[]>(mockTrafficTrend);
  const [protocols, setProtocols] = useState<ProtocolStat[]>(mockProtocols);
  const [anomalies, setAnomalies] = useState<Anomaly[]>(mockAnomalies);
  const [flows, setFlows] = useState<TrafficFlow[]>(mockFlows);
  const [dataSource, setDataSource] = useState<string>("DEMO");
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const api = getApiUrl();

  const fetchDashboardData = async () => {
    try {
      // 1. Dashboard summary metrics & charts
      const dashRes = await fetch(`${api}/api/dashboard`);
      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.metrics && Array.isArray(d.metrics)) {
          setMetrics(d.metrics);
        }
        if (d.traffic_trend && Array.isArray(d.traffic_trend)) {
          setTrafficTrend(d.traffic_trend);
        }
        if (d.protocol_distribution && Array.isArray(d.protocol_distribution)) {
          setProtocols(d.protocol_distribution.map((p: any) => ({
            protocol: p.protocol,
            packets: p.packets ?? p.count ?? 0,
            bytes: p.bytes ?? 0,
            percentage: p.percentage ?? 0,
          })));
        }
        setDataSource(d.data_source ?? "LIVE_DB");
        setIsLive(true);
      }

      // 2. Anomalies table
      const anomRes = await fetch(`${api}/api/anomalies`);
      if (anomRes.ok) {
        const a = await anomRes.json();
        if (a.anomalies && Array.isArray(a.anomalies)) {
          setAnomalies(a.anomalies.map((item: any) => ({
            id: String(item.id),
            timestamp: item.timestamp,
            srcIp: item.src_ip ?? item.srcIp,
            dstIp: item.dst_ip ?? item.dstIp,
            type: item.type,
            severity: item.severity,
            score: item.score,
            description: item.description ?? "",
            status: item.status,
          })));
        }
      }

      // 3. Traffic flows table
      const flowRes = await fetch(`${api}/api/traffic/flows?limit=6`);
      if (flowRes.ok) {
        const f = await flowRes.json();
        if (f.flows && Array.isArray(f.flows)) {
          setFlows(f.flows.map((item: any) => ({
            id: String(item.id),
            timestamp: item.timestamp,
            srcIp: item.src_ip ?? item.srcIp,
            dstIp: item.dst_ip ?? item.dstIp,
            srcPort: item.src_port ?? item.srcPort,
            dstPort: item.dst_port ?? item.dstPort,
            protocol: item.protocol,
            bytes: item.bytes,
            packets: item.packets,
            duration: item.duration,
            label: item.label,
            confidence: item.confidence ?? 0.99,
          })));
        }
      }

      setLastUpdated(new Date());
    } catch {
      // Offline fallback: keep mock data
      setIsLive(false);
      setDataSource("DEMO (Backend Offline)");
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="fade-in-up">
      {/* Sub-header with live status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            Data Source:
          </span>
          {isLive ? (
            <span className="badge badge-active" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="live-dot" /> {dataSource}
            </span>
          ) : (
            <span className="badge badge-investigating">
              {dataSource}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          <RefreshCw size={12} />
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="metrics-grid">
        {metrics.map((card) => {
          const meta = metricIcons[card.id] ?? { icon: <Wifi size={16} />, color: "#3b82f6" };
          return (
            <MetricCard
              key={card.id}
              {...card}
              icon={meta.icon}
              color={meta.color}
            />
          );
        })}
      </div>

      {/* Traffic trend + Protocol distribution */}
      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Traffic Trend (24h)</span>
            <span className={isLive ? "badge badge-active" : "demo-badge"}>
              {isLive ? "DB Aggregate" : "Demo Data"}
            </span>
          </div>
          <div className="chart-wrapper-lg">
            <TrafficChart data={trafficTrend} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Protocol Distribution</span>
            <span className={isLive ? "badge badge-active" : "demo-badge"}>
              {isLive ? "DB Aggregate" : "Demo Data"}
            </span>
          </div>
          <div className="chart-wrapper-lg">
            <ProtocolChart data={protocols} />
          </div>
        </div>
      </div>

      {/* Recent anomalies + Recent flows */}
      <div className="grid-2">
        {/* Anomalies */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Anomalies</span>
            <span className="badge badge-active" style={{ fontSize: "0.68rem" }}>
              {anomalies.filter((a) => a.status === "active").length} active
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Source IP</th>
                  <th>Severity</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 5).map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{a.type}</td>
                    <td><span className="ip-text">{a.srcIp}</span></td>
                    <td><span className={severityClass(a.severity)}>{a.severity}</span></td>
                    <td>
                      <span style={{ color: a.score > 0.8 ? "var(--color-danger)" : "var(--color-warning)" }}>
                        {(a.score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td><span className={statusClass(a.status)}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Flows */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Traffic Flows</span>
            <span className={isLive ? "badge badge-active" : "demo-badge"} style={{ fontSize: "0.68rem" }}>
              {isLive ? "Real Flows" : "Demo Data"}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Src IP</th>
                  <th>Dst IP</th>
                  <th>Proto</th>
                  <th>Bytes</th>
                  <th>Label</th>
                </tr>
              </thead>
              <tbody>
                {flows.slice(0, 6).map((f) => (
                  <tr key={f.id}>
                    <td><span className="ip-text">{f.srcIp}</span></td>
                    <td><span className="ip-text">{f.dstIp}</span></td>
                    <td>
                      <span style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.78rem",
                        color: "var(--color-accent-secondary)",
                      }}>
                        {f.protocol}
                      </span>
                    </td>
                    <td>{formatBytes(f.bytes)}</td>
                    <td><span className={labelClass(f.label)}>{f.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
