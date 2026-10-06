// =========================================================
// NetMine AI — Protocol Analytics
// 100% Live Protocol Statistics — Computed from Live Traffic Engine
// =========================================================
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Radio, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import Topbar from "../components/layout/Topbar";
import ProtocolChart from "../charts/ProtocolChart";
import ProtocolBarChart from "../charts/ProtocolBarChart";
import { getApiUrl } from "../services/api";
import type { ProtocolStat } from "../types";

const API = getApiUrl();

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

const PALETTE = [
  "#3b82f6", "#06b6d4", "#8b5cf6", "#ec4899", "#22c55e",
  "#f59e0b", "#6366f1", "#14b8a6", "#f43f5e", "#a855f7",
  "#38bdf8", "#eab308", "#10b981", "#fb7185", "#818cf8"
];

export default function Protocols() {
  const [protocols, setProtocols] = useState<ProtocolStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProtocols = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/traffic/statistics`);
      if (!res.ok) throw new Error("Failed to fetch protocol statistics");
      const data = await res.json();
      setProtocols(Array.isArray(data) ? data : []);
    } catch {
      // Keep previous list on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProtocols();
    const interval = setInterval(fetchProtocols, 2500);
    return () => clearInterval(interval);
  }, [fetchProtocols]);

  const totalPackets = protocols.reduce((s, p) => s + (p.packets || 0), 0);
  const totalBytes = protocols.reduce((s, p) => s + (p.bytes || 0), 0);

  // Take top protocols for charts to keep them clean
  const topForCharts = protocols.slice(0, 7);

  return (
    <>
      <Topbar title="Protocol Analytics" subtitle="Live network protocol distribution & statistics" />
      <div className="page-content fade-in-up">

        {/* Page Header */}
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div className="page-header-left">
            <h1 className="page-header-title">Protocol Analytics</h1>
            <p className="page-header-subtitle">
              {protocols.length === 0
                ? "Breakdown of observed network protocols across captured flows"
                : `${protocols.length} active protocol${protocols.length === 1 ? "" : "s"} identified across ${totalPackets.toLocaleString()} captured packets`}
            </p>
          </div>
          <button
            className="btn btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}
            onClick={fetchProtocols}
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>

        {protocols.length === 0 ? (
          <div className="card" style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-accent-blue)",
            }}>
              <Radio size={26} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", fontWeight: 600 }}>
                No Protocol Data Captured Yet
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)", maxWidth: 460 }}>
                Protocols are dynamically extracted and classified in real-time as traffic passes through NetMine AI.
              </p>
            </div>
            <Link to="/live" className="btn btn-primary" style={{ marginTop: 8 }}>
              Go to Live Traffic
            </Link>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="stats-strip">
              <div className="stats-strip-item">
                <span className="stats-strip-label">Total Volume</span>
                <span className="stats-strip-value">{formatBytes(totalBytes)}</span>
                <span className="stats-strip-sub">{totalPackets.toLocaleString()} pkts</span>
              </div>
              {protocols.slice(0, 4).map((p, i) => (
                <div className="stats-strip-item" key={p.protocol}>
                  <span className="stats-strip-label">{p.protocol}</span>
                  <span className="stats-strip-value" style={{ color: PALETTE[i % PALETTE.length] }}>
                    {p.percentage}%
                  </span>
                  <span className="stats-strip-sub">{p.packets.toLocaleString()} pkts</span>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="card-title">Distribution (Donut)</span>
                  <span className="live-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span className="live-dot" /> LIVE
                  </span>
                </div>
                <div className="chart-wrapper-lg">
                  <ProtocolChart data={topForCharts} />
                </div>
              </div>
              <div className="card">
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="card-title">Packet Count (Bar)</span>
                  <span className="live-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span className="live-dot" /> LIVE
                  </span>
                </div>
                <div className="chart-wrapper-lg">
                  <ProtocolBarChart data={topForCharts} />
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={16} color="var(--color-accent-blue)" />
                  <span className="card-title">Detailed Protocol Breakdown ({protocols.length} types)</span>
                </div>
                <span className="live-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span className="live-dot" /> LIVE ENGINE
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Protocol</th>
                      <th>Packets</th>
                      <th>Bytes</th>
                      <th>Share (%)</th>
                      <th>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocols.map((p, i) => {
                      const color = PALETTE[i % PALETTE.length];
                      const pct = totalPackets > 0 ? (p.packets / totalPackets) * 100 : 0;
                      return (
                        <tr key={p.protocol}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                              <strong style={{ color: "var(--color-text-primary)" }}>{p.protocol}</strong>
                            </div>
                          </td>
                          <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{p.packets.toLocaleString()}</td>
                          <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{formatBytes(p.bytes)}</td>
                          <td style={{ fontFamily: '"JetBrains Mono",monospace', color, fontWeight: 700 }}>
                            {p.percentage}%
                          </td>
                          <td style={{ width: 220 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--color-bg-hover)", overflow: "hidden" }}>
                                <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", borderRadius: 3, background: color }} />
                              </div>
                              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", minWidth: 42 }}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}
