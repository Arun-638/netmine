import Topbar from "../components/layout/Topbar";
import { Activity, Play, Square } from "lucide-react";
import { mockFlows } from "../mock/data";

function formatBytes(bytes: number): string {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function LiveTraffic() {
  return (
    <>
      <Topbar title="Live Traffic" subtitle="Real-time packet flow monitor" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Live Traffic Monitor</h1>
            <p className="page-header-subtitle">
              Flow-level traffic analysis — capture not yet active
            </p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" disabled>
              <Play size={14} /> Start Capture
            </button>
            <button className="btn btn-danger" disabled>
              <Square size={14} /> Stop
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="card" style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {[
              { label: "Capture Rate", value: "-- pkt/s", note: "NOT IMPLEMENTED" },
              { label: "Processing Rate", value: "-- flows/s", note: "NOT IMPLEMENTED" },
              { label: "Queue Size", value: "--", note: "NOT IMPLEMENTED" },
              { label: "Dropped Packets", value: "--", note: "NOT IMPLEMENTED" },
              { label: "Latency", value: "-- ms", note: "NOT IMPLEMENTED" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', color: "var(--color-text-muted)" }}>{stat.value}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--color-accent-purple)" }}>{stat.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Flows (Demo)</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th><th>Src IP</th><th>Dst IP</th>
                  <th>Src Port</th><th>Dst Port</th><th>Proto</th>
                  <th>Bytes</th><th>Packets</th><th>Label</th><th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {mockFlows.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.75rem" }}>
                      {new Date(f.timestamp).toLocaleTimeString()}
                    </td>
                    <td><span className="ip-text">{f.srcIp}</span></td>
                    <td><span className="ip-text">{f.dstIp}</span></td>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.78rem" }}>{f.srcPort}</td>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.78rem" }}>{f.dstPort}</td>
                    <td style={{ color: "var(--color-accent-secondary)", fontWeight: 500 }}>{f.protocol}</td>
                    <td>{formatBytes(f.bytes)}</td>
                    <td>{f.packets}</td>
                    <td>
                      <span className={f.label === "BENIGN" ? "badge badge-benign" : "badge badge-high"}>
                        {f.label}
                      </span>
                    </td>
                    <td style={{ color: f.confidence > 0.9 ? "var(--color-success)" : "var(--color-warning)" }}>
                      {(f.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
