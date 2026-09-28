// =========================================================
// NetMine AI — Reports Page (Phase 2 Frontend)
//
// Shows pre-built analytical reports:
//   - Daily summary export preview
//   - Attack type breakdown
//   - Top talkers (most active IPs)
//   - Timeline heatmap (24h)
// All data is DEMO. Real export in Phase 10.
// =========================================================
import { useState } from "react";
import { Download, FileText, Calendar, BarChart2 } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { mockAnomalies, mockDevices, mockFlows } from "../mock/data";

// Attack type breakdown from mock anomalies
const ATTACK_COUNTS = mockAnomalies.reduce((acc, a) => {
  acc[a.type] = (acc[a.type] ?? 0) + 1;
  return acc;
}, {} as Record<string, number>);

// Top talkers from mock flows
const TALKER_MAP: Record<string, number> = {};
mockFlows.forEach(f => {
  TALKER_MAP[f.srcIp] = (TALKER_MAP[f.srcIp] ?? 0) + f.bytes;
});
const TOP_TALKERS = Object.entries(TALKER_MAP)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([ip, bytes]) => ({ ip, bytes }));

function formatBytes(b: number) {
  if (b > 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b > 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${b} B`;
}

// 24-hour heatmap bins (0–23)
const heatmap = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  flows: Math.floor(200 + Math.random() * 900 + (h >= 8 && h <= 18 ? 600 : 0)),
  anomalies: Math.floor(Math.random() * (h === 4 || h === 14 ? 8 : 2)),
}));

function heatColor(val: number, max: number) {
  const pct = val / max;
  if (pct > 0.8) return "#ef4444";
  if (pct > 0.5) return "#f59e0b";
  if (pct > 0.25) return "#3b82f6";
  return "#1e3a5f";
}

const maxFlows = Math.max(...heatmap.map(h => h.flows));

const REPORTS = [
  { id: "daily",   title: "Daily Summary",         desc: "Traffic overview, top protocols, anomaly count — last 24h.", icon: <Calendar size={18} /> },
  { id: "weekly",  title: "Weekly Threat Report",  desc: "Aggregated threats, attack types, device risk ranking — last 7 days.", icon: <BarChart2 size={18} /> },
  { id: "ml",      title: "ML Performance Report", desc: "Model accuracy, confusion matrix, F1 breakdown per class.", icon: <FileText size={18} /> },
  { id: "pcap",    title: "PCAP Export",            desc: "Export raw packet capture for Wireshark analysis.", icon: <Download size={18} /> },
];

export default function Reports() {
  const [exporting, setExporting] = useState<string | null>(null);

  function handleExport(id: string) {
    setExporting(id);
    setTimeout(() => setExporting(null), 1800);
  }

  return (
    <>
      <Topbar title="Reports" subtitle="Analytical summaries and data exports" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Reports & Exports</h1>
            <p className="page-header-subtitle">
              Pre-built reports · Export functionality in{" "}
              <span style={{ color: "var(--color-accent-purple)" }}>Phase 10</span>
            </p>
          </div>
        </div>

        {/* Report cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {REPORTS.map(r => (
            <div className="card" key={r.id} style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--color-accent-primary)",
                  }}>
                    {r.icon}
                  </div>
                  <h3 style={{ fontWeight: 700 }}>{r.title}</h3>
                </div>
                <button
                  onClick={() => handleExport(r.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: exporting === r.id ? "var(--color-success)" : "var(--color-accent-primary)",
                    color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px",
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <Download size={13} />
                  {exporting === r.id ? "Exporting…" : "Export"}
                </button>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                {r.desc}
              </p>
              <p style={{ fontSize: "0.68rem", color: "var(--color-accent-amber)", marginTop: 8 }}>
                ⚠ Export generates a demo JSON — real PDF/CSV export in Phase 10
              </p>
            </div>
          ))}
        </div>

        {/* Attack type breakdown */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Attack Type Breakdown</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Attack Type</th><th>Count</th><th>Share</th><th>Distribution</th></tr></thead>
              <tbody>
                {Object.entries(ATTACK_COUNTS).map(([type, count]) => (
                  <tr key={type}>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{type}</td>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{count}</td>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>
                      {((count / mockAnomalies.length) * 100).toFixed(0)}%
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--color-bg-hover)" }}>
                          <div style={{
                            width: `${(count / mockAnomalies.length) * 100}%`,
                            height: "100%", borderRadius: 3,
                            background: "var(--color-accent-primary)",
                          }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top talkers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Talkers (by bytes)</span>
              <span className="demo-badge">Demo</span>
            </div>
            <table className="data-table">
              <thead><tr><th>#</th><th>IP Address</th><th>Bytes Sent</th></tr></thead>
              <tbody>
                {TOP_TALKERS.map((t, i) => (
                  <tr key={t.ip}>
                    <td style={{ color: "var(--color-text-muted)", fontFamily: '"JetBrains Mono",monospace' }}>{i + 1}</td>
                    <td><span className="ip-text">{t.ip}</span></td>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace', color: "var(--color-accent-secondary)" }}>
                      {formatBytes(t.bytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 24h traffic heatmap */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">24-Hour Traffic Heatmap</span>
              <span className="demo-badge">Demo</span>
            </div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 8 }}>
              {heatmap.map(h => (
                <div
                  key={h.hour}
                  title={`${h.hour}:00 — ${h.flows} flows, ${h.anomalies} anomalies`}
                  style={{
                    width: 32, height: 32, borderRadius: 4,
                    background: heatColor(h.flows, maxFlows),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6rem", color: "rgba(255,255,255,0.6)",
                    cursor: "default", transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {h.hour}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1e3a5f", display: "inline-block" }} /> Low
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#3b82f6", display: "inline-block" }} /> Medium
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b", display: "inline-block" }} /> High
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444", display: "inline-block" }} /> Peak
              </span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
