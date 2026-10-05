// =========================================================
// NetMine AI — Anomalies Page
// Real-Time Live Capture Threat Stream + Isolation Forest Scoring
// =========================================================
import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Shield, CheckCircle, Cpu, RefreshCw,
  Zap, Trash2, Check, Clock, Radio
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { mockAnomalies } from "../mock/data";
import { getApiUrl } from "../services/api";
import type { Anomaly } from "../types";

function severityClass(s: string) {
  const m: Record<string, string> = {
    critical: "badge badge-critical",
    high:     "badge badge-high",
    medium:   "badge badge-medium",
    low:      "badge badge-low",
  };
  return m[s] ?? "badge";
}

function statusClass(s: string) {
  const m: Record<string, string> = {
    active:        "badge badge-active",
    resolved:      "badge badge-resolved",
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
  const [viewMode,       setViewMode]       = useState<"LIVE" | "BENCHMARK">("LIVE");

  const [anomalies,   setAnomalies]   = useState<Anomaly[]>([]);
  const [dataSource,  setDataSource]  = useState<string>("CONNECTING");
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [metrics,     setMetrics]     = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  const api = getApiUrl();

  const fetchAnomalies = useCallback(async () => {
    try {
      const url = viewMode === "LIVE" ? `${api}/api/anomalies?source=live` : `${api}/api/anomalies?source=benchmark`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        if (d && d.anomalies) {
          const mapped: Anomaly[] = d.anomalies.map((a: any) => ({
            id: a.id,
            timestamp: a.timestamp,
            srcIp: a.src_ip ?? a.srcIp,
            dstIp: a.dst_ip ?? a.dstIp,
            type: a.type,
            severity: a.severity,
            score: a.score,
            description: a.description,
            status: a.status,
          }));
          setAnomalies(mapped);
          setDataSource(d.data_source ?? "LIVE_CAPTURE");
          setIsLiveActive(d.data_source === "LIVE_CAPTURE");
        }
      }
      setLastUpdated(new Date());
    } catch {
      setDataSource("OFFLINE");
      setIsLiveActive(false);
    }
  }, [api, viewMode]);

  // Initial fetch and auto-polling every 2 seconds
  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 2000);
    return () => clearInterval(interval);
  }, [fetchAnomalies]);

  // Fetch model metrics once
  useEffect(() => {
    fetch(`${api}/api/anomalies/metrics`)
      .then(r => r.json())
      .then(m => {
        if (m && m.status === "trained") {
          setMetrics(m);
        }
      })
      .catch(() => {});
  }, [api]);

  // Inject a live test threat to test real-time pipeline
  const handleSimulateThreat = async (threatType: string) => {
    try {
      setIsInjecting(true);
      await fetch(`${api}/api/anomalies/simulate-threat?threat_type=${threatType}&severity=high`, {
        method: "POST",
      });
      await fetchAnomalies();
    } catch (err) {
      console.error("Failed to inject threat:", err);
    } finally {
      setIsInjecting(false);
    }
  };

  // Update status (e.g. resolve or investigate)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    try {
      await fetch(`${api}/api/anomalies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  // Clear live stream
  const handleClear = async () => {
    try {
      await fetch(`${api}/api/anomalies/clear`, { method: "POST" });
      setAnomalies([]);
    } catch (e) {
      console.error("Failed to clear anomalies:", e);
    }
  };

  // Purge old stale DB records
  const handlePurgeStale = async () => {
    try {
      await fetch(`${api}/api/anomalies/purge-stale`, { method: "POST" });
      await fetchAnomalies();
    } catch (e) {
      console.error("Failed to purge stale records:", e);
    }
  };

  const filtered = anomalies.filter(a =>
    (severityFilter === "ALL" || a.severity === severityFilter) &&
    (statusFilter   === "ALL" || a.status   === statusFilter)
  );

  const counts = {
    critical: anomalies.filter(a => a.severity === "critical").length,
    high:     anomalies.filter(a => a.severity === "high").length,
    medium:   anomalies.filter(a => a.severity === "medium").length,
    active:   anomalies.filter(a => a.status === "active").length,
    investigating: anomalies.filter(a => a.status === "investigating").length,
    resolved: anomalies.filter(a => a.status === "resolved").length,
  };

  return (
    <>
      <Topbar title="Anomalies" subtitle="Real-time behavioral deviations & threat indicators" />
      <div className="page-content fade-in-up">

        {/* Header with Mode Switcher & Live Pulse */}
        <div className="page-header" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="page-header-left">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="page-header-title">Anomaly Detection Engine</h1>
              {isLiveActive ? (
                <span className="badge badge-active" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="live-dot" /> Live Capture Stream
                </span>
              ) : (
                <span className="badge badge-medium">
                  {dataSource}
                </span>
              )}
            </div>
            <p className="page-header-subtitle">
              Real-time Isolation Forest scores · XGBoost threat correlation · TShark wire capture
            </p>
          </div>

          {/* Quick Actions & View Mode Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{
              background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
              borderRadius: 8, padding: 3, display: "flex", gap: 4,
            }}>
              <button
                className={`tab-btn${viewMode === "LIVE" ? " active" : ""}`}
                style={{ padding: "5px 12px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => setViewMode("LIVE")}
              >
                <Radio size={13} color={viewMode === "LIVE" ? "var(--color-success)" : "currentColor"} />
                Live Threats ({anomalies.length})
              </button>
              <button
                className={`tab-btn${viewMode === "BENCHMARK" ? " active" : ""}`}
                style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                onClick={() => setViewMode("BENCHMARK")}
              >
                🗄️ CICIDS2017 Archive
              </button>
            </div>

            {/* Test Trigger Button */}
            <button
              className="btn btn-primary"
              style={{ fontSize: "0.8rem", padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
              onClick={() => handleSimulateThreat("PortScan")}
              disabled={isInjecting}
              title="Inject a real-time PortScan threat event to verify live reactivity"
            >
              <Zap size={14} />
              {isInjecting ? "Injecting..." : "⚡ Test PortScan"}
            </button>

            <button
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem", padding: "6px 12px", color: "var(--color-accent-amber)" }}
              onClick={handlePurgeStale}
              title="Purge all old resolved loopback test records from database"
            >
              🧹 Purge Stale DB
            </button>

            <button
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              onClick={handleClear}
              title="Clear displayed anomalies"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="stats-strip">
          {[
            { label: "Critical",      value: counts.critical,      color: "var(--color-danger)"  },
            { label: "High",          value: counts.high,          color: "#fca5a5"               },
            { label: "Medium",        value: counts.medium,        color: "var(--color-warning)"  },
            { label: "Active",        value: counts.active,        color: "var(--color-danger)"   },
            { label: "Investigating", value: counts.investigating, color: "var(--color-warning)"  },
            { label: "Resolved",      value: counts.resolved,       color: "var(--color-success)"  },
          ].map(s => (
            <div className="stats-strip-item" key={s.label}>
              <span className="stats-strip-label">{s.label}</span>
              <span className="stats-strip-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stats-strip-sub">threats</span>
            </div>
          ))}
        </div>

        {/* Main Anomalies Card */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="card-title">
                {viewMode === "LIVE" ? "Real-Time Inferred Threat Feed" : "CICIDS2017 Unsupervised Benchmark Results"}
              </span>
              <span className="badge badge-active" style={{ fontSize: "0.7rem" }}>
                Auto-refreshing (2s)
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              <Clock size={13} />
              <span>Polled: {lastUpdated.toLocaleTimeString()}</span>
            </div>
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
              {filtered.length} of {anomalies.length} threats shown
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Detection Time</th>
                  <th>Attack Type</th>
                  <th>Source IP</th>
                  <th>Target IP</th>
                  <th>Severity</th>
                  <th style={{ minWidth: 140 }}>Anomaly Score</th>
                  <th>Behavioral Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      {viewMode === "LIVE" ? (
                        <div>
                          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>
                            No active threats detected on the wire.
                          </p>
                          <p style={{ fontSize: "0.82rem" }}>
                            Traffic is normal (BENIGN). Click <strong>"⚡ Test PortScan"</strong> above to inject a live detection test event.
                          </p>
                        </div>
                      ) : (
                        "No benchmark anomaly records found."
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map(a => (
                    <tr key={a.id} style={{ background: a.status === "active" ? "rgba(239,68,68,0.03)" : "transparent" }}>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                        {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                        {a.type}
                      </td>
                      <td><span className="ip-text">{a.srcIp}</span></td>
                      <td><span className="ip-text">{a.dstIp}</span></td>
                      <td><span className={severityClass(a.severity)}>{a.severity}</span></td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar-track" style={{ width: 75 }}>
                            <div
                              className="score-bar-fill"
                              style={{ width: `${Math.min(100, Math.max(a.score * 100, 5))}%`, background: scoreColor(a.score) }}
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
                      <td style={{ maxWidth: 320, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                        {a.description}
                      </td>
                      <td><span className={statusClass(a.status)}>{a.status}</span></td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {a.status === "active" ? (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "3px 8px", fontSize: "0.72rem", color: "var(--color-accent-amber)" }}
                            onClick={() => handleUpdateStatus(a.id, "investigating")}
                            title="Mark as investigating"
                          >
                            Investigate
                          </button>
                        ) : a.status === "investigating" ? (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "3px 8px", fontSize: "0.72rem", color: "var(--color-success)" }}
                            onClick={() => handleUpdateStatus(a.id, "resolved")}
                            title="Mark as resolved"
                          >
                            <Check size={12} /> Resolve
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Closed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Algorithm status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          {[
            {
              title: "Isolation Forest Model (Unsupervised)",
              desc: "Evaluates multi-dimensional flow metrics (duration, packet rates, byte variance). Detects unknown network anomalies and statistical outliers by measuring tree isolation depth.",
              status: "Phase 7 — Active in Pipeline",
              active: true,
              color: "#8b5cf6",
              detail: metrics ? `Contamination: ${(metrics.contamination * 100).toFixed(0)}% · Detection Rate: ${(metrics.attack_detection_rate * 100).toFixed(1)}%` : "Real-time decision function scoring active.",
            },
            {
              title: "XGBoost Supervised Threat Engine",
              desc: "Classifies live bidirectional network flows across 15 CICIDS2017 attack categories using 70 extracted flow features.",
              status: "Phase 6 & 10 — Resampled & Active",
              active: true,
              color: "#3b82f6",
              detail: "Multi-class inference running on live TShark packet streams.",
            },
          ].map(alg => (
            <div className="card" key={alg.title}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{alg.title}</h3>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px",
                    borderRadius: 10,
                    background: alg.active ? "rgba(34,197,94,0.12)" : `${alg.color}20`,
                    color: alg.active ? "var(--color-success)" : alg.color,
                    border: `1px solid ${alg.active ? "rgba(34,197,94,0.3)" : `${alg.color}40`}`,
                    textTransform: "uppercase",
                  }}>
                    {alg.status}
                  </span>
                </div>
                {alg.active ? <CheckCircle size={18} color="var(--color-success)" /> : <Shield size={18} color="var(--color-text-muted)" />}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 8 }}>
                {alg.desc}
              </p>
              {alg.detail && (
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                  {alg.detail}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
