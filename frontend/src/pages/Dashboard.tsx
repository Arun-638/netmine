// =========================================================
// NetMine AI — Dashboard Page
// Data source: DEMO — mock/data.ts
// =========================================================
import {
  Activity, AlertTriangle, Monitor, Globe,
  Wifi, Package, Database, Heart,
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
  return l === "BENIGN" ? "badge badge-benign" : "badge badge-high";
}

function formatBytes(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function Dashboard() {
  return (
    <div className="fade-in-up">
      {/* Metric cards */}
      <div className="metrics-grid">
        {mockMetricCards.map((card) => {
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
            <span className="demo-badge">Demo Data</span>
          </div>
          <div className="chart-wrapper-lg">
            <TrafficChart data={mockTrafficTrend} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Protocol Distribution</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div className="chart-wrapper-lg">
            <ProtocolChart data={mockProtocols} />
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
              {mockAnomalies.filter((a) => a.status === "active").length} active
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
                {mockAnomalies.slice(0, 5).map((a) => (
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
                {mockFlows.slice(0, 6).map((f) => (
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

