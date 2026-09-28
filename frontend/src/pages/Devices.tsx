// =========================================================
// NetMine AI — Devices Page (Phase 2)
// =========================================================
import { useState } from "react";
import { Monitor, AlertTriangle } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { mockDevices } from "../mock/data";

function formatBytes(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${bytes} B`;
}

export default function Devices() {
  const [filter, setFilter] = useState("ALL");

  const displayed = mockDevices.filter(d => filter === "ALL" || d.status === filter);
  const suspicious = mockDevices.filter(d => d.status === "suspicious");

  return (
    <>
      <Topbar title="Devices" subtitle="Network host inventory" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Device Inventory</h1>
            <p className="page-header-subtitle">
              {mockDevices.length} hosts discovered — Device detection from live capture in Phase 9
            </p>
          </div>
        </div>

        <div className="stats-strip">
          {[
            { label: "Total Devices",  value: mockDevices.length, color: undefined },
            { label: "Active",         value: mockDevices.filter(d=>d.status==="active").length, color: "var(--color-success)" },
            { label: "Suspicious",     value: suspicious.length, color: "var(--color-warning)" },
            { label: "Inactive",       value: mockDevices.filter(d=>d.status==="inactive").length, color: "var(--color-text-muted)" },
            { label: "Total Traffic",  value: formatBytes(mockDevices.reduce((s,d)=>s+d.totalBytes,0)), color: undefined },
          ].map(s => (
            <div className="stats-strip-item" key={s.label}>
              <span className="stats-strip-label">{s.label}</span>
              <span className="stats-strip-value" style={s.color ? { color: s.color } : undefined}>{s.value}</span>
              <span className="stats-strip-sub">DEMO DATA</span>
            </div>
          ))}
        </div>

        {suspicious.length > 0 && (
          <div style={{
            display: "flex", gap: 10, alignItems: "center",
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "var(--radius-lg)", padding: "12px 16px", marginBottom: 16,
          }}>
            <AlertTriangle size={16} color="var(--color-warning)" />
            <span style={{ fontSize: "0.82rem", color: "var(--color-warning)" }}>
              <strong>{suspicious.length} suspicious device{suspicious.length > 1 ? "s" : ""}</strong> detected —
              {suspicious.map(d => ` ${d.ip}`).join(",")}
            </span>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">All Devices ({displayed.length})</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div className="filter-bar">
            {["ALL", "active", "suspicious", "inactive"].map(f => (
              <button
                key={f}
                className={`tab-btn${filter === f ? " active" : ""}`}
                style={{ flex: "initial", padding: "6px 14px" }}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th><th>IP Address</th><th>Hostname</th>
                  <th>Total Traffic</th><th>Packets</th>
                  <th>Protocols</th><th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(d => (
                  <tr key={d.id} style={d.status === "suspicious" ? { background: "rgba(245,158,11,0.04)" } : undefined}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={`status-dot ${d.status}`} />
                        <span style={{ fontSize: "0.78rem", textTransform: "capitalize" }}>
                          {d.status}
                        </span>
                      </div>
                    </td>
                    <td><span className="ip-text">{d.ip}</span></td>
                    <td style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {d.hostname}
                    </td>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.8rem" }}>
                      {formatBytes(d.totalBytes)}
                    </td>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.8rem" }}>
                      {d.totalPackets.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {d.protocols.map(p => (
                          <span key={p} className="chip chip-blue">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      {new Date(d.lastSeen).toLocaleTimeString()}
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
