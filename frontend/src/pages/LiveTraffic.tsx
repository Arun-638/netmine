// =========================================================
// NetMine AI — Live Traffic Page (Phase 2)
//
// What this does:
//   Uses useSimulatedTraffic hook to animate incoming flows.
//   Start/Stop controls simulate what the FastAPI WebSocket
//   connection will do in Phase 12.
//
// What is DEMO:
//   All flows are randomly generated — NOT real network data.
//   The hook API matches the future WebSocket contract.
// =========================================================
import { useState } from "react";
import { Play, Square, Trash2, Wifi, WifiOff, Download } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import TrafficChart from "../charts/TrafficChart";
import { useSimulatedTraffic } from "../hooks/useSimulatedTraffic";
import { mockTrafficTrend } from "../mock/data";

function formatBytes(bytes: number): string {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function labelClass(l: string) {
  return l === "BENIGN" ? "badge badge-benign" : "badge badge-high";
}

function rowColor(label: string): string {
  return label !== "BENIGN" ? "rgba(239,68,68,0.04)" : "transparent";
}

const PROTO_COLOR: Record<string, string> = {
  TCP: "chip chip-blue", UDP: "chip chip-cyan", ICMP: "chip chip-amber",
};

export default function LiveTraffic() {
  const [filterLabel, setFilterLabel] = useState("ALL");
  const [filterProto, setFilterProto] = useState("ALL");

  const { flows, isRunning, packetsPerSec, start, stop, clear } =
    useSimulatedTraffic(100, 600);

  const displayed = flows.filter(f =>
    (filterLabel === "ALL" || f.label === filterLabel) &&
    (filterProto === "ALL" || f.protocol === filterProto)
  );

  const attackCount  = flows.filter(f => f.label !== "BENIGN").length;
  const totalBytes   = flows.reduce((s, f) => s + f.bytes, 0);

  return (
    <>
      <Topbar
        title="Live Traffic"
        subtitle={isRunning ? "Simulation running — DEMO MODE" : "Capture not active"}
      />
      <div className="page-content fade-in-up">

        {/* Controls */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Live Traffic Monitor</h1>
            <p className="page-header-subtitle">
              Flow-level traffic simulation ·{" "}
              <span style={{ color: "var(--color-accent-amber)" }}>
                DEMO MODE — simulated flows, not real capture
              </span>
            </p>
          </div>
          <div className="page-header-actions">
            {!isRunning ? (
              <button className="btn btn-primary" onClick={start}>
                <Play size={13} /> Start Simulation
              </button>
            ) : (
              <button className="btn btn-danger" onClick={stop}>
                <Square size={13} /> Stop
              </button>
            )}
            <button className="btn btn-ghost" onClick={clear} disabled={flows.length === 0}>
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="stats-strip">
          {[
            {
              label: "Status",
              value: isRunning ? "RUNNING" : "STOPPED",
              sub: isRunning ? "Simulation active" : "Click Start",
              color: isRunning ? "var(--color-success)" : "var(--color-text-muted)",
            },
            { label: "Flows Captured", value: flows.length.toLocaleString(), sub: "in buffer" },
            { label: "Packets / sec",  value: isRunning ? `~${packetsPerSec}` : "—", sub: "simulated" },
            { label: "Threats Found",  value: attackCount.toString(), sub: "non-BENIGN flows", color: attackCount > 0 ? "var(--color-danger)" : undefined },
            { label: "Total Bytes",    value: formatBytes(totalBytes), sub: "in buffer" },
            { label: "Backend",        value: "NOT IMPL.",  sub: "FastAPI — Phase 3" },
          ].map(s => (
            <div className="stats-strip-item" key={s.label}>
              <span className="stats-strip-label">{s.label}</span>
              <span className="stats-strip-value" style={s.color ? { color: s.color } : undefined}>
                {s.value}
              </span>
              <span className="stats-strip-sub">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* 24h trend chart */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isRunning
                ? <><span className="live-dot" /> <span style={{ fontSize: "0.8rem", color: "var(--color-success)", fontWeight: 600 }}>SIMULATION ACTIVE</span></>
                : <><WifiOff size={14} color="var(--color-text-muted)" /> <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>SIMULATION STOPPED</span></>
              }
            </div>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
            Chart below shows a 24-hour static demo trend. In Phase 12, this will update in real-time via WebSocket.
          </div>
          <div className="chart-wrapper-lg">
            <TrafficChart data={mockTrafficTrend} />
          </div>
        </div>

        {/* Live flow table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Flow Stream ({displayed.length} flows)
            </span>
            {isRunning && <span className="live-dot" />}
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <select
              className="filter-select"
              value={filterLabel}
              onChange={e => setFilterLabel(e.target.value)}
            >
              <option value="ALL">All Labels</option>
              <option value="BENIGN">BENIGN</option>
              <option value="PortScan">PortScan</option>
              <option value="SSHBrute">SSHBrute</option>
              <option value="DDoS">DDoS</option>
              <option value="RDPAttack">RDPAttack</option>
            </select>
            <select
              className="filter-select"
              value={filterProto}
              onChange={e => setFilterProto(e.target.value)}
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
              {flows.length === 0
                ? "Click 'Start Simulation' to begin"
                : `Showing ${displayed.length} / ${flows.length} flows`}
            </span>
          </div>

          {flows.length === 0 ? (
            <div className="not-implemented" style={{ padding: 32 }}>
              <Wifi size={36} color="var(--color-text-muted)" />
              <p style={{ fontWeight: 600 }}>No flows yet</p>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Click <strong>Start Simulation</strong> to generate demo traffic flows.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
              <table className="data-table" style={{ minWidth: 860 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--color-bg-card)", zIndex: 2 }}>
                  <tr>
                    <th>Time</th><th>Src IP</th><th>Dst IP</th>
                    <th>Port</th><th>Proto</th><th>Bytes</th>
                    <th>Pkts</th><th>Label</th><th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(f => (
                    <tr key={f.id} style={{ background: rowColor(f.label) }}>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                        {new Date(f.timestamp).toLocaleTimeString()}
                      </td>
                      <td><span className="ip-text">{f.srcIp}</span></td>
                      <td><span className="ip-text">{f.dstIp}</span></td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.78rem" }}>
                        {f.srcPort}→{f.dstPort}
                      </td>
                      <td>
                        <span className={PROTO_COLOR[f.protocol] ?? "chip chip-purple"}>
                          {f.protocol}
                        </span>
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.78rem" }}>
                        {formatBytes(f.bytes)}
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.78rem" }}>
                        {f.packets}
                      </td>
                      <td>
                        <span className={labelClass(f.label)}>{f.label}</span>
                      </td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar-track">
                            <div
                              className="score-bar-fill"
                              style={{
                                width: `${f.confidence * 100}%`,
                                background: f.confidence > 0.9
                                  ? "var(--color-success)"
                                  : "var(--color-accent-primary)",
                              }}
                            />
                          </div>
                          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.72rem" }}>
                            {(f.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
