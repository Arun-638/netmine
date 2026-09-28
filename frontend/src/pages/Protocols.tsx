// =========================================================
// NetMine AI — Protocol Analytics (Phase 2)
// Two charts: Donut + Horizontal bar, plus detailed table
// =========================================================
import Topbar from "../components/layout/Topbar";
import ProtocolChart from "../charts/ProtocolChart";
import ProtocolBarChart from "../charts/ProtocolBarChart";
import { mockProtocols } from "../mock/data";

function formatBytes(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${bytes} B`;
}

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b"];

export default function Protocols() {
  const total = mockProtocols.reduce((s, p) => s + p.packets, 0);

  return (
    <>
      <Topbar title="Protocol Analytics" subtitle="Network protocol distribution and statistics" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Protocol Analytics</h1>
            <p className="page-header-subtitle">
              Breakdown of observed network protocols across all captured flows
            </p>
          </div>
        </div>

        {/* Summary strip */}
        <div className="stats-strip">
          {mockProtocols.map((p, i) => (
            <div className="stats-strip-item" key={p.protocol}>
              <span className="stats-strip-label">{p.protocol}</span>
              <span className="stats-strip-value" style={{ color: COLORS[i] }}>
                {p.percentage}%
              </span>
              <span className="stats-strip-sub">{p.packets.toLocaleString()} pkts</span>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Distribution (Donut)</span>
              <span className="demo-badge">Demo Data</span>
            </div>
            <div className="chart-wrapper-lg"><ProtocolChart data={mockProtocols} /></div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Packet Count (Bar)</span>
              <span className="demo-badge">Demo Data</span>
            </div>
            <div className="chart-wrapper-lg"><ProtocolBarChart data={mockProtocols} /></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Detailed Statistics</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Protocol</th><th>Packets</th><th>Bytes</th>
                <th>Share (%)</th><th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {mockProtocols.map((p, i) => (
                <tr key={p.protocol}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i], flexShrink: 0 }} />
                      <strong style={{ color: "var(--color-text-primary)" }}>{p.protocol}</strong>
                    </div>
                  </td>
                  <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{p.packets.toLocaleString()}</td>
                  <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{formatBytes(p.bytes)}</td>
                  <td style={{ fontFamily: '"JetBrains Mono",monospace', color: COLORS[i], fontWeight: 700 }}>{p.percentage}%</td>
                  <td style={{ width: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--color-bg-hover)", overflow: "hidden" }}>
                        <div style={{ width: `${(p.packets / total) * 100}%`, height: "100%", borderRadius: 3, background: COLORS[i] }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", minWidth: 36 }}>
                        {((p.packets / total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
