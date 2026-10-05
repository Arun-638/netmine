// =========================================================
// NetMine AI — Live Traffic Monitor (Phase 9 updated)
//
// Dual-Mode Traffic Engine:
//   Mode 1: Live Network Packet Capture (TShark + Npcap + Real-Time ML Inference)
//   Mode 2: Simulated Traffic (Demo Mode)
// =========================================================
import { useState, useEffect, useRef } from "react";
import { Play, Square, Trash2, Wifi, WifiOff, Cpu, Activity, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import TrafficChart from "../charts/TrafficChart";
import { useSimulatedTraffic } from "../hooks/useSimulatedTraffic";
import { mockTrafficTrend } from "../mock/data";
import { getApiUrl } from "../services/api";

const API = getApiUrl();

interface CaptureInterface {
  id: string;
  device: string;
  name: string;
  is_default: boolean;
}

interface LiveFlow {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  bytes: number;
  packets: number;
  duration: number;
  label: string;
  confidence: number;
  anomaly_score: number;
  data_source: string;
}

interface CaptureStatus {
  active: boolean;
  interface: string;
  interface_id: string;
  duration_seconds: number;
  packets_captured: number;
  bytes_captured: number;
  flows_analyzed: number;
  attacks_detected: number;
  packets_per_sec: number;
  bytes_per_sec: number;
  models_active: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function labelClass(l: string) {
  if (l === "BENIGN") return "badge badge-benign";
  if (l === "PortScan") return "badge badge-medium";
  if (l.includes("DoS") || l === "DDoS" || l === "Heartbleed") return "badge badge-critical";
  if (l.includes("Patator") || l.includes("Brute")) return "badge badge-high";
  if (l === "Bot" || l.includes("Web Attack") || l === "Infiltration") return "badge badge-high";
  return "badge badge-critical";
}

function anomalyClass(score: number) {
  if (score >= 0.70) return "var(--color-danger)";
  if (score >= 0.40) return "var(--color-warning)";
  return "var(--color-success)";
}

const PROTO_COLOR: Record<string, string> = {
  TCP: "chip chip-blue",
  UDP: "chip chip-cyan",
  ICMP: "chip chip-amber",
  TLS: "chip chip-purple",
  DNS: "chip chip-green",
};

export default function LiveTraffic() {
  const [engineMode, setEngineMode] = useState<"LIVE" | "SIM">("LIVE");

  // Live capture states
  const [interfaces, setInterfaces] = useState<CaptureInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>("5");
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>({
    active: false,
    interface: "Wi-Fi",
    interface_id: "5",
    duration_seconds: 0,
    packets_captured: 0,
    bytes_captured: 0,
    flows_analyzed: 0,
    attacks_detected: 0,
    packets_per_sec: 0,
    bytes_per_sec: 0,
    models_active: true,
  });
  const [liveFlows, setLiveFlows] = useState<LiveFlow[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Filters
  const [filterLabel, setFilterLabel] = useState("ALL");
  const [filterProto, setFilterProto] = useState("ALL");

  // Simulated traffic hook for DEMO fallback
  const sim = useSimulatedTraffic(100, 600);

  // Poll available interfaces on mount
  useEffect(() => {
    fetch(`${API}/api/capture/interfaces`)
      .then(r => r.json())
      .then(d => {
        if (d && d.interfaces && d.interfaces.length > 0) {
          setInterfaces(d.interfaces);
          const def = d.interfaces.find((i: CaptureInterface) => i.is_default);
          if (def) setSelectedInterface(def.id);
        }
      })
      .catch(() => {});
  }, []);

  // Poll status & flows when in LIVE mode
  useEffect(() => {
    if (engineMode !== "LIVE") return;

    const interval = setInterval(() => {
      fetch(`${API}/api/capture/status`)
        .then(r => r.json())
        .then(s => setCaptureStatus(s))
        .catch(() => {});

      fetch(`${API}/api/capture/flows?limit=50`)
        .then(r => r.json())
        .then(d => {
          if (d && d.flows) setLiveFlows(d.flows);
        })
        .catch(() => {});
    }, 1000);

    return () => clearInterval(interval);
  }, [engineMode]);

  const handleStartCapture = async () => {
    setIsStarting(true);
    const ifaceObj = interfaces.find(i => i.id === selectedInterface);
    const ifaceName = ifaceObj ? ifaceObj.name : "Wi-Fi";

    try {
      const res = await fetch(`${API}/api/capture/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: selectedInterface, name: ifaceName }),
      });
      const data = await res.json();
      setCaptureStatus(prev => ({ ...prev, active: true, interface: ifaceName }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopCapture = async () => {
    try {
      await fetch(`${API}/api/capture/stop`, { method: "POST" });
      setCaptureStatus(prev => ({ ...prev, active: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearFlows = async () => {
    if (engineMode === "LIVE") {
      setLiveFlows([]);
      try {
        await fetch(`${API}/api/capture/clear`, { method: "POST" });
        setCaptureStatus(prev => ({
          ...prev,
          packets_captured: 0,
          bytes_captured: 0,
          flows_analyzed: 0,
          attacks_detected: 0,
          packets_per_sec: 0,
          bytes_per_sec: 0,
        }));
      } catch (e) {
        console.error("Failed to clear live flows:", e);
      }
    } else {
      sim.clear();
    }
  };

  // Flows to display based on active mode
  const displayedFlows = (engineMode === "LIVE" ? liveFlows : sim.flows).filter(f => {
    const matchesLabel =
      filterLabel === "ALL"
        ? true
        : filterLabel === "ATTACKS_ONLY"
        ? f.label !== "BENIGN"
        : f.label === filterLabel || (filterLabel === "Web Attack" && (f.label || "").startsWith("Web Attack"));
    const protoStr = (f.protocol || "").toUpperCase();
    const matchesProto =
      filterProto === "ALL"
        ? true
        : protoStr.includes(filterProto.toUpperCase());
    return matchesLabel && matchesProto;
  });

  const isLiveRunning = captureStatus.active;
  const isRunning = engineMode === "LIVE" ? isLiveRunning : sim.isRunning;

  return (
    <>
      <Topbar
        title="Live Traffic Monitor"
        subtitle={
          engineMode === "LIVE"
            ? (isLiveRunning ? `Real-Time Capture Active (${captureStatus.interface})` : "TShark Capture Idle")
            : (sim.isRunning ? "Simulation Running" : "Simulation Stopped")
        }
      />
      <div className="page-content fade-in-up">

        {/* Page Header with Mode Selector */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Live Traffic Monitor</h1>
            <p className="page-header-subtitle">
              {engineMode === "LIVE" ? (
                <span>
                  🟢 <strong>TShark 4.6.8 + Npcap Engine:</strong> Capturing live raw frames, reassembling flows, and predicting threats with <strong>XGBoost</strong> in real-time.
                </span>
              ) : (
                <span style={{ color: "var(--color-accent-amber)" }}>
                  🎲 <strong>Simulated Mode:</strong> Testing UI flows without requiring local network interface sniffing.
                </span>
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
              borderRadius: 8, padding: 3, display: "flex",
            }}>
              <button
                className={`tab-btn${engineMode === "LIVE" ? " active" : ""}`}
                style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                onClick={() => setEngineMode("LIVE")}
              >
                🔴 Live TShark Engine
              </button>
              <button
                className={`tab-btn${engineMode === "SIM" ? " active" : ""}`}
                style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                onClick={() => setEngineMode("SIM")}
              >
                🎲 Simulated Stream
              </button>
            </div>
          </div>
        </div>

        {/* Live Controls Card */}
        <div className="card" style={{ marginBottom: 16, padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {engineMode === "LIVE" ? (
                <>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Capture Interface:</span>
                  <select
                    className="filter-select"
                    style={{ minWidth: 220 }}
                    value={selectedInterface}
                    onChange={e => setSelectedInterface(e.target.value)}
                    disabled={isLiveRunning}
                  >
                    {interfaces.length > 0 ? (
                      interfaces.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.id}. {i.name} {i.is_default ? "(Default)" : ""}
                        </option>
                      ))
                    ) : (
                      <option value="5">5. Wi-Fi</option>
                    )}
                  </select>

                  {!isLiveRunning ? (
                    <button className="btn btn-primary" onClick={handleStartCapture} disabled={isStarting}>
                      <Play size={13} /> {isStarting ? "Starting TShark..." : "Start Real Capture"}
                    </button>
                  ) : (
                    <button className="btn btn-danger" onClick={handleStopCapture}>
                      <Square size={13} /> Stop Live Capture
                    </button>
                  )}
                </>
              ) : (
                <>
                  {!sim.isRunning ? (
                    <button className="btn btn-primary" onClick={sim.start}>
                      <Play size={13} /> Start Simulation
                    </button>
                  ) : (
                    <button className="btn btn-danger" onClick={sim.stop}>
                      <Square size={13} /> Stop Simulation
                    </button>
                  )}
                </>
              )}

              <button
                className="btn btn-ghost"
                onClick={handleClearFlows}
                disabled={displayedFlows.length === 0 && (engineMode !== "LIVE" || captureStatus.flows_analyzed === 0)}
              >
                <Trash2 size={13} /> Clear Table
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              <Cpu size={14} color="var(--color-accent-primary)" />
              <span>Real-Time Inference: <strong>XGBoost (70 feats)</strong> + <strong>IsoForest</strong></span>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="stats-strip">
          {[
            {
              label: "Status",
              value: isRunning ? (engineMode === "LIVE" ? "CAPTURING" : "SIMULATING") : "IDLE",
              sub: isRunning ? (engineMode === "LIVE" ? captureStatus.interface : "Active") : "Click Start",
              color: isRunning ? "var(--color-success)" : "var(--color-text-muted)",
            },
            {
              label: "Packets / sec",
              value: engineMode === "LIVE" ? `${captureStatus.packets_per_sec}` : (sim.isRunning ? `~${sim.packetsPerSec}` : "—"),
              sub: engineMode === "LIVE" ? "live wire rate" : "simulated",
            },
            {
              label: "Throughput",
              value: engineMode === "LIVE" ? `${(captureStatus.bytes_per_sec / 1024).toFixed(1)} KB/s` : "—",
              sub: "network bandwidth",
            },
            {
              label: "Flows Analyzed",
              value: engineMode === "LIVE" ? captureStatus.flows_analyzed.toLocaleString() : sim.flows.length.toLocaleString(),
              sub: "bidirectional windows",
            },
            {
              label: "Threats Found",
              value: engineMode === "LIVE" ? captureStatus.attacks_detected.toString() : sim.flows.filter(f => f.label !== "BENIGN").length.toString(),
              sub: "non-BENIGN flows",
              color: (engineMode === "LIVE" ? captureStatus.attacks_detected : sim.flows.filter(f => f.label !== "BENIGN").length) > 0 ? "var(--color-danger)" : undefined,
            },
            {
              label: "ML Model Status",
              value: "XGBoost",
              sub: "Trained on CICIDS2017",
              color: "var(--color-accent-amber)",
            },
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

        {/* Live Flow Stream Table */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="card-title">Live Flow Stream ({displayedFlows.length} flows)</span>
              {isRunning && <span className="live-dot" />}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <select className="filter-select" value={filterLabel} onChange={e => setFilterLabel(e.target.value)}>
                <option value="ALL">All Predictions</option>
                <option value="ATTACKS_ONLY">⚡ All Threats (non-BENIGN)</option>
                <option value="BENIGN">BENIGN only</option>
                <option value="PortScan">PortScan</option>
                <option value="DoS Hulk">DoS Hulk</option>
                <option value="DoS GoldenEye">DoS GoldenEye</option>
                <option value="DoS slowloris">DoS slowloris</option>
                <option value="DoS Slowhttptest">DoS Slowhttptest</option>
                <option value="DDoS">DDoS</option>
                <option value="FTP-Patator">FTP-Patator</option>
                <option value="SSH-Patator">SSH-Patator</option>
                <option value="Bot">Bot</option>
                <option value="Web Attack">Web Attack</option>
                <option value="Infiltration">Infiltration</option>
                <option value="Heartbleed">Heartbleed</option>
              </select>
              <select className="filter-select" value={filterProto} onChange={e => setFilterProto(e.target.value)}>
                <option value="ALL">All Protocols</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="TLS">TLS</option>
                <option value="DNS">DNS</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source IP : Port</th>
                  <th>Destination IP : Port</th>
                  <th>Protocol</th>
                  <th>Packets</th>
                  <th>Bytes</th>
                  <th>Duration</th>
                  <th>ML Prediction</th>
                  <th>Confidence</th>
                  <th>Anomaly Score</th>
                </tr>
              </thead>
              <tbody>
                {displayedFlows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 36, color: "var(--color-text-muted)" }}>
                      {isRunning ? "Waiting for flow windows to complete (4s timeout)..." : "Capture is idle. Click 'Start Real Capture' to sniff live network packets."}
                    </td>
                  </tr>
                ) : (
                  displayedFlows.map((f: any) => (
                    <tr key={f.id} style={{ background: f.label !== "BENIGN" ? "rgba(239,68,68,0.06)" : "transparent" }}>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                        {new Date(f.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.78rem" }}>
                        <span className="ip-text">{f.src_ip ?? f.srcIp}</span>:{f.src_port ?? f.srcPort}
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.78rem" }}>
                        <span className="ip-text">{f.dst_ip ?? f.dstIp}</span>:{f.dst_port ?? f.dstPort}
                      </td>
                      <td>
                        <span className={PROTO_COLOR[f.protocol.toUpperCase()] ?? "chip chip-cyan"}>
                          {f.protocol}
                        </span>
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{f.packets}</td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{formatBytes(f.bytes)}</td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', color: "var(--color-text-muted)" }}>
                        {typeof f.duration === "number" ? f.duration.toFixed(2) : f.duration}s
                      </td>
                      <td>
                        <span className={labelClass(f.label)}>
                          {f.label}
                        </span>
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600 }}>
                        {((f.confidence ?? 0.99) * 100).toFixed(1)}%
                      </td>
                      <td>
                        <span style={{
                          fontFamily: '"JetBrains Mono",monospace', fontWeight: 600,
                          color: anomalyClass(f.anomaly_score ?? 0.05),
                        }}>
                          {(((f.anomaly_score ?? 0.05)) * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
