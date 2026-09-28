// =========================================================
// NetMine AI — Anomalies Page (Phase 2)
//
// Features:
//   - Filterable by severity and status
//   - Score progress bars with colour coding
//   - Summary strip with counts
//   - Clear NOT YET EVALUATED markers for Isolation Forest
// =========================================================
import { useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { mockAnomalies } from "../mock/data";

function severityClass(s: string) {
  const m: Record<string, string> = {
    critical: "badge badge-critical", high: "badge badge-high",
    medium: "badge badge-medium",     low:  "badge badge-low",
  };
  return m[s] ?? "badge";
}

function statusClass(s: string) {
  const m: Record<string, string> = {
    active: "badge badge-active", resolved: "badge badge-resolved",
    investigating: "badge badge-investigating",
  };
  return m[s] ?? "badge";
}

function scoreColor(score: number) {
  if (score >= 0.85) return "var(--color-danger)";
  if (score >= 0.65) return "var(--color-warning)";
  return "var(--color-success)";
}

export default function Anomalies() {
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter,   setStatusFilter]   = useState("ALL");

  const filtered = mockAnomalies.filter(a =>
    (severityFilter === "ALL" || a.severity === severityFilter) &&
    (statusFilter   === "ALL" || a.status   === statusFilter)
  );

  const counts = {
    critical: mockAnomalies.filter(a => a.severity === "critical").length,
    high:     mockAnomalies.filter(a => a.severity === "high").length,
    medium:   mockAnomalies.filter(a => a.severity === "medium").length,
    active:   mockAnomalies.filter(a => a.status === "active").length,
  };

  return (
    <>
      <Topbar title="Anomalies" subtitle="Behavioral deviations and threat indicators" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Anomaly Detection</h1>
            <p className="page-header-subtitle">
              Isolation Forest · DBSCAN Noise · Rule-based detection ·{" "}
              <span style={{ color: "var(--color-accent-purple)" }}>
                NOT YET EVALUATED
              </span>
            </p>
          </div>
        </div>

        {/* Summary strip */}
        <div className="stats-strip">
          {[
            { label: "Critical",      value: counts.critical, color: "var(--color-danger)"  },
            { label: "High",          value: counts.high,     color: "#fca5a5"               },
            { label: "Medium",        value: counts.medium,   color: "var(--color-warning)"  },
            { label: "Active",        value: counts.active,   color: "var(--color-danger)"   },
            { label: "Investigating", value: mockAnomalies.filter(a=>a.status==="investigating").length, color: "var(--color-warning)" },
            { label: "Resolved",      value: mockAnomalies.filter(a=>a.status==="resolved").length,     color: "var(--color-success)" },
          ].map(s => (
            <div className="stats-strip-item" key={s.label}>
              <span className="stats-strip-label">{s.label}</span>
              <span className="stats-strip-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stats-strip-sub">anomalies</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">All Anomalies ({filtered.length})</span>
            <span className="demo-badge">Demo Data</span>
          </div>

          <div className="filter-bar">
            <select className="filter-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
              {filtered.length} of {mockAnomalies.length} shown
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th><th>Type</th><th>Source IP</th>
                  <th>Destination IP</th><th>Severity</th>
                  <th style={{ minWidth: 130 }}>Anomaly Score</th>
                  <th>Description</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                      {new Date(a.timestamp).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                      {a.type}
                    </td>
                    <td><span className="ip-text">{a.srcIp}</span></td>
                    <td><span className="ip-text">{a.dstIp}</span></td>
                    <td><span className={severityClass(a.severity)}>{a.severity}</span></td>
                    <td>
                      <div className="score-bar-wrap">
                        <div className="score-bar-track" style={{ width: 80 }}>
                          <div
                            className="score-bar-fill"
                            style={{ width: `${a.score * 100}%`, background: scoreColor(a.score) }}
                          />
                        </div>
                        <span style={{
                          fontFamily: '"JetBrains Mono",monospace',
                          fontSize: "0.78rem",
                          color: scoreColor(a.score),
                          fontWeight: 600,
                        }}>
                          {(a.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 280, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      {a.description}
                    </td>
                    <td><span className={statusClass(a.status)}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Algorithm status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          {[
            {
              title: "Isolation Forest",
              desc: "Unsupervised anomaly scoring. Each flow gets a score 0–1. High scores = anomalous.",
              phase: "Phase 7",
              color: "#8b5cf6",
            },
            {
              title: "DBSCAN Noise Detection",
              desc: "Flows assigned cluster_id = -1 are flagged as anomalous behavior not fitting any cluster.",
              phase: "Phase 7",
              color: "#3b82f6",
            },
          ].map(alg => (
            <div className="card" key={alg.title}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{alg.title}</h3>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px",
                    borderRadius: 10, background: `${alg.color}20`,
                    color: alg.color, border: `1px solid ${alg.color}40`,
                    textTransform: "uppercase",
                  }}>
                    {alg.phase} — NOT YET EVALUATED
                  </span>
                </div>
                <Shield size={18} color="var(--color-text-muted)" />
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                {alg.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
