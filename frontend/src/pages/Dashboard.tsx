// =========================================================
// NetMine AI — Dashboard Page
// 100% Live Data — no mock or demo data
// =========================================================
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, Monitor,
  Wifi, Package, Database, Heart, RefreshCw, Zap,
  ArrowRight, ShieldAlert,
} from "lucide-react";
import MetricCard from "../components/ui/MetricCard";
import TrafficChart from "../charts/TrafficChart";
import ProtocolChart from "../charts/ProtocolChart";
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
  const [metrics, setMetrics] = useState<MetricCardData[]>([]);
  const [trafficTrend, setTrafficTrend] = useState<TrafficTrendPoint[]>([]);
  const [protocols, setProtocols] = useState<ProtocolStat[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [flows, setFlows] = useState<TrafficFlow[]>([]);
  const [dataSource, setDataSource] = useState<string>("IDLE");
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [bottomTab, setBottomTab] = useState<"flows" | "anomalies">("flows");

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
          setTrafficTrend(
            d.traffic_trend.map((pt: any) => ({
              time: pt.time,
              packetsPerSec: pt.packets_per_sec ?? pt.packetsPerSec ?? pt.packets ?? 0,
              bytesPerSec: pt.bytes_per_sec ?? pt.bytesPerSec ?? pt.bytes ?? 0,
              anomalies: pt.anomalies ?? 0,
            }))
          );
        }
        if (d.protocol_distribution && Array.isArray(d.protocol_distribution)) {
          setProtocols(d.protocol_distribution.map((p: any) => ({
            protocol: p.protocol,
            packets: p.packets ?? p.count ?? 0,
            bytes: p.bytes ?? 0,
            percentage: p.percentage ?? 0,
          })));
        }
        setDataSource(d.data_source ?? "IDLE");
        setIsLive(d.data_source === "LIVE_CAPTURE" || d.data_source === "RECENT_CACHE");
      }

      // 2. Anomalies — live source only
      const anomRes = await fetch(`${api}/api/anomalies?source=live`);
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

      // 3. Traffic flows — live capture engine
      const flowRes = await fetch(`${api}/api/capture/flows?limit=10`);
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
      setIsLive(false);
      setDataSource("OFFLINE");
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 2500);
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
              {dataSource === "OFFLINE" ? "Backend Offline" : dataSource}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          <RefreshCw size={12} />
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metric cards */}
      {metrics.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          color: "var(--color-text-muted)", fontSize: "0.9rem",
          background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--color-border)", marginBottom: 20,
        }}>
          <Zap size={32} style={{ marginBottom: 12, color: "var(--color-accent)" }} />
          <div><strong style={{ color: "var(--color-text-primary)" }}>No live data yet</strong></div>
          <div style={{ marginTop: 6 }}>Start packet capture on the Live Traffic page to see real-time metrics here.</div>
        </div>
      ) : (
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
      )}

      {/* Traffic trend + Protocol distribution */}
      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Traffic Trend</span>
            <span className={isLive ? "badge badge-active" : "badge badge-investigating"}>
              {isLive ? "Live" : "Idle"}
            </span>
          </div>
          <div className="chart-wrapper-lg">
            {trafficTrend.length > 0
              ? <TrafficChart data={trafficTrend} />
              : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>No traffic data — start capture</div>
            }
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Protocol Distribution</span>
            <span className={isLive ? "badge badge-active" : "badge badge-investigating"}>
              {isLive ? "Live" : "Idle"}
            </span>
          </div>
          <div className="chart-wrapper-lg">
            {protocols.length > 0
              ? <ProtocolChart data={protocols} />
              : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>No protocol data — start capture</div>
            }
          </div>
        </div>
      </div>

      {/* Security Threat Alert (Visible if active threats exist) */}
      {anomalies.filter((a) => a.status === "active").length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: "var(--radius-md)",
          marginBottom: 16,
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={18} color="var(--color-danger)" />
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", fontWeight: 500 }}>
              <strong style={{ color: "var(--color-danger)" }}>Active Security Threat:</strong>{" "}
              {anomalies.filter((a) => a.status === "active").length} anomalous event(s) detected.
            </span>
          </div>
          <button
            className="btn btn-danger"
            style={{ fontSize: "0.75rem", padding: "4px 12px" }}
            onClick={() => setBottomTab("anomalies")}
          >
            Review Threats
          </button>
        </div>
      )}

      {/* Full-width Live Traffic Stream & Anomalies Card */}
      <div className="card" style={{ width: "100%" }}>
        <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
          {/* Tabs */}
          <div className="table-tabs">
            <button
              className={`table-tab-btn ${bottomTab === "flows" ? "active" : ""}`}
              onClick={() => setBottomTab("flows")}
            >
              <Activity size={14} />
              <span>Recent Traffic Flows</span>
              <span style={{
                fontSize: "0.7rem",
                padding: "1px 6px",
                borderRadius: 10,
                background: bottomTab === "flows" ? "rgba(59, 130, 246, 0.25)" : "rgba(255, 255, 255, 0.06)",
                color: bottomTab === "flows" ? "var(--color-accent-primary)" : "var(--color-text-muted)",
              }}>
                {flows.length}
              </span>
            </button>

            <button
              className={`table-tab-btn ${bottomTab === "anomalies" ? "active" : ""}`}
              onClick={() => setBottomTab("anomalies")}
            >
              <AlertTriangle size={14} />
              <span>Security Anomalies</span>
              {anomalies.filter((a) => a.status === "active").length > 0 ? (
                <span style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.25)",
                  color: "var(--color-danger)",
                  fontWeight: 700,
                }}>
                  {anomalies.filter((a) => a.status === "active").length} active
                </span>
              ) : (
                <span style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "var(--color-text-muted)",
                }}>
                  {anomalies.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick link & status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={isLive ? "badge badge-active" : "badge badge-investigating"} style={{ fontSize: "0.68rem" }}>
              {isLive ? "Live Stream" : "Engine Idle"}
            </span>
            {bottomTab === "flows" ? (
              <Link
                to="/live"
                className="btn btn-ghost"
                style={{ fontSize: "0.78rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                Full Live Stream <ArrowRight size={13} />
              </Link>
            ) : (
              <Link
                to="/anomalies"
                className="btn btn-ghost"
                style={{ fontSize: "0.78rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                All Anomalies <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>

        {/* Tab 1: Live Traffic Flows */}
        {bottomTab === "flows" && (
          <div style={{ width: "100%", overflowX: "auto" }}>
            {flows.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                <Activity size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div>No traffic flows recorded yet</div>
                <div style={{ fontSize: "0.75rem", marginTop: 4 }}>
                  Packets captured by the engine stream here automatically in real time.
                </div>
              </div>
            ) : (
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Proto</th>
                    <th>Packets</th>
                    <th>Volume</th>
                    <th>Duration</th>
                    <th>ML Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {flows.slice(0, 10).map((f) => (
                    <tr key={f.id}>
                      <td style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                      }}>
                        {f.timestamp ? new Date(f.timestamp).toLocaleTimeString() : "--:--:--"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="ip-text" title={f.srcIp}>{f.srcIp}</span>
                        {f.srcPort && <span className="port-pill">:{f.srcPort}</span>}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="ip-text" title={f.dstIp}>{f.dstIp}</span>
                        {f.dstPort && <span className="port-pill">:{f.dstPort}</span>}
                      </td>
                      <td>
                        <span className={`protocol-chip protocol-chip-${
                          (f.protocol || "").toLowerCase() === "tcp"
                            ? "tcp"
                            : (f.protocol || "").toLowerCase() === "udp"
                            ? "udp"
                            : (f.protocol || "").toLowerCase() === "icmp"
                            ? "icmp"
                            : (f.protocol || "").toLowerCase() === "dns"
                            ? "dns"
                            : "other"
                        }`}>
                          {f.protocol || "OTHER"}
                        </span>
                      </td>
                      <td style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.8rem",
                        color: "var(--color-text-primary)",
                      }}>
                        {(f.packets || 1).toLocaleString()}
                      </td>
                      <td style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.8rem",
                        color: "var(--color-text-primary)",
                      }}>
                        {formatBytes(f.bytes)}
                      </td>
                      <td style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}>
                        {f.duration ? `${f.duration.toFixed(2)}s` : "< 0.01s"}
                      </td>
                      <td>
                        <span className={labelClass(f.label)}>
                          {f.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Security Anomalies */}
        {bottomTab === "anomalies" && (
          <div style={{ width: "100%", overflowX: "auto" }}>
            {anomalies.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                <ShieldAlert size={28} style={{ opacity: 0.4, marginBottom: 8, color: "var(--color-success)" }} />
                <div style={{ color: "var(--color-success)", fontWeight: 600 }}>No anomalies detected — all clear</div>
                <div style={{ fontSize: "0.75rem", marginTop: 4 }}>
                  The AI anomaly detector is monitoring all inbound and outbound network flows.
                </div>
              </div>
            ) : (
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Threat / Type</th>
                    <th>Source IP</th>
                    <th>Destination IP</th>
                    <th>Severity</th>
                    <th>Anomaly Score</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.slice(0, 10).map((a) => (
                    <tr key={a.id}>
                      <td style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                      }}>
                        {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : "--:--:--"}
                      </td>
                      <td style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                        {a.type}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="ip-text" title={a.srcIp}>{a.srcIp}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="ip-text" title={a.dstIp}>{a.dstIp || "—"}</span>
                      </td>
                      <td><span className={severityClass(a.severity)}>{a.severity}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 50,
                            height: 6,
                            borderRadius: 3,
                            background: "rgba(255, 255, 255, 0.1)",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              width: `${Math.min(100, a.score * 100)}%`,
                              height: "100%",
                              background: a.score > 0.8 ? "var(--color-danger)" : "var(--color-warning)",
                            }} />
                          </div>
                          <span style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: "0.75rem",
                            color: a.score > 0.8 ? "var(--color-danger)" : "var(--color-warning)",
                            fontWeight: 600,
                          }}>
                            {(a.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td><span className={statusClass(a.status)}>{a.status}</span></td>
                      <td>
                        <Link to="/anomalies" className="btn btn-ghost" style={{ fontSize: "0.72rem", padding: "3px 8px" }}>
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
