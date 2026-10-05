// =========================================================
// NetMine AI — Settings Page (Phase 2 Frontend)
//
// Covers:
//   - API connection config (backend URL)
//   - Capture interface selector (Phase 9)
//   - Display preferences (dark/light placeholders)
//   - ML model threshold sliders (Phase 7)
//   - Team info panel
// =========================================================
import { useState } from "react";
import { Save, RefreshCw, Server, Cpu, Shield, Users, RotateCcw } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { loadSettings, saveSettings, resetSettings } from "../services/api";

type Section = "Connection" | "Capture" | "ML Thresholds" | "Team";

const SECTIONS: Section[] = ["Connection", "Capture", "ML Thresholds", "Team"];

const TEAM = [
  { name: "Arun A Raj",       role: "Full-Stack + ML Lead",          color: "#3b82f6" },
  { name: "Adithyan H",       role: "Data Mining + Backend",          color: "#8b5cf6" },
  { name: "Vaishnav Prakash", role: "Network Security + TShark",      color: "#22c55e" },
];

export default function Settings() {
  const [section,      setSection]      = useState<Section>("Connection");
  const [initial]                       = useState(() => loadSettings());
  const [apiUrl,       setApiUrl]       = useState(initial.apiUrl);
  const [iface,        setIface]        = useState(initial.iface);
  const [ifThreshold,  setIfThreshold]  = useState(initial.ifThreshold);
  const [dbscanEps,    setDbscanEps]    = useState(initial.dbscanEps);
  const [dbscanMin,    setDbscanMin]    = useState(initial.dbscanMin);
  const [saved,        setSaved]        = useState(false);

  function handleSave() {
    saveSettings({ apiUrl, iface, ifThreshold, dbscanEps, dbscanMin });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    const def = resetSettings();
    setApiUrl(def.apiUrl);
    setIface(def.iface);
    setIfThreshold(def.ifThreshold);
    setDbscanEps(def.dbscanEps);
    setDbscanMin(def.dbscanMin);
    setSaved(false);
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Configuration and preferences" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Settings</h1>
            <p className="page-header-subtitle">
              Application configuration & preferences · Persisted in browser storage
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleReset}
              className="btn btn-ghost"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}
              title="Reset all settings to default values"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={handleSave}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: saved ? "var(--color-success)" : "var(--color-accent-primary)",
                color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px",
                fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                transition: "background 0.3s",
              }}
            >
              {saved ? <><RefreshCw size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          {/* Sidebar */}
          <div className="card" style={{ padding: 8, height: "fit-content" }}>
            {SECTIONS.map(s => (
              <button
                key={s}
                className={`tab-btn${section === s ? " active" : ""}`}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: "0.82rem",
                }}
                onClick={() => setSection(s)}
              >
                {s === "Connection"    && <Server size={14} />}
                {s === "Capture"       && <Shield size={14} />}
                {s === "ML Thresholds" && <Cpu size={14} />}
                {s === "Team"          && <Users size={14} />}
                {s}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>

            {section === "Connection" && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: 6 }}>Backend API Connection</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                  The React frontend connects to the FastAPI backend at this URL.
                  Change this if you run the backend on a different host or port.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
                    Backend API URL
                  </label>
                  <input
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)", fontSize: "0.9rem",
                      fontFamily: '"JetBrains Mono",monospace',
                    }}
                  />
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 8, fontSize: "0.8rem", color: "var(--color-success)",
                }}>
                  <div className="live-dot" />
                  <span>Backend endpoint: <strong>{apiUrl}/api/health</strong></span>
                </div>
                <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--color-bg-surface)", borderRadius: 8, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  <p><strong style={{ color: "var(--color-text-primary)" }}>Real-Time Inference:</strong> Live TShark captures stream flows to the analytics engine and dashboard via REST and WebSockets.</p>
                </div>
              </div>
            )}

            {section === "Capture" && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: 6 }}>Network Capture Settings</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                  Configure the default network interface for live packet capture with TShark and Npcap.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
                    Preferred Interface
                  </label>
                  <select
                    value={iface}
                    onChange={e => setIface(e.target.value)}
                    className="filter-select"
                    style={{ width: "100%" }}
                  >
                    {["Wi-Fi", "Ethernet", "Loopback", "VPN0"].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: "0.72rem", color: "var(--color-accent-amber)", marginTop: 6 }}>
                    ⚠ Active system interfaces can be selected directly on the <strong>Live Traffic</strong> page.
                  </p>
                </div>

                <div style={{
                  padding: "12px 16px", background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8,
                  fontSize: "0.8rem", color: "var(--color-success)",
                }}>
                  <strong>CAPTURE READY</strong> — Live capture integration is enabled with TShark 4.6.8 and Npcap drivers.
                </div>
              </div>
            )}

            {section === "ML Thresholds" && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: 6 }}>ML Decision Thresholds</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                  These thresholds control anomaly scoring and DBSCAN cluster boundary detection.
                </p>

                {[
                  {
                    label: "Isolation Forest Score Threshold",
                    key: "if", value: ifThreshold, set: setIfThreshold,
                    min: 0.5, max: 1.0, step: 0.01,
                    desc: "Flows scoring above this threshold are flagged as anomalous.",
                    fmt: (v: number) => v.toFixed(2),
                  },
                  {
                    label: "DBSCAN eps (neighbourhood radius)",
                    key: "eps", value: dbscanEps, set: setDbscanEps,
                    min: 0.1, max: 2.0, step: 0.1,
                    desc: "Smaller eps = tighter clusters = more noise points.",
                    fmt: (v: number) => v.toFixed(1),
                  },
                  {
                    label: "DBSCAN min_samples",
                    key: "minSamples", value: dbscanMin, set: setDbscanMin,
                    min: 2, max: 20, step: 1,
                    desc: "Minimum flows to form a cluster core.",
                    fmt: (v: number) => String(v),
                  },
                ].map(s => (
                  <div key={s.key} style={{ marginBottom: 20 }}>
                    <div className="range-group">
                      <div className="range-label">
                        <span>{s.label}</span>
                        <span style={{ color: "var(--color-accent-secondary)", fontFamily: '"JetBrains Mono",monospace' }}>
                          {s.fmt(s.value)}
                        </span>
                      </div>
                      <input
                        type="range" min={s.min} max={s.max} step={s.step}
                        value={s.value} onChange={e => s.set(parseFloat(e.target.value))}
                      />
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                      {s.desc}
                    </p>
                  </div>
                ))}

                <div style={{
                  padding: "10px 14px", background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8,
                  fontSize: "0.78rem", color: "var(--color-accent-primary)",
                }}>
                  ACTIVE — Changes saved here persist in your browser and are evaluated during interactive analytics.
                </div>
              </div>
            )}

            {section === "Team" && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: 6 }}>Project Team</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                  AI-Powered Network Traffic Analytics & Anomaly Detection Platform — B.Tech Final Year Project
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {TEAM.map(m => (
                    <div key={m.name} className="card" style={{ borderLeft: `3px solid ${m.color}`, padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--color-text-primary)" }}>{m.name}</div>
                      <div style={{ fontSize: "0.8rem", color: m.color }}>{m.role}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                  padding: "14px 18px", background: "var(--color-bg-surface)", borderRadius: 10,
                  fontSize: "0.8rem",
                }}>
                  {[
                    ["Project",   "AI-Powered Network Traffic Analytics & Anomaly Detection"],
                    ["Short Name","NetMine AI"],
                    ["Domains",   "Data Mining · ML · Cybersecurity · Full-Stack"],
                    ["Dataset",   "CICIDS2017 & UNSW-NB15 Cross-Evaluation"],
                    ["Stack",     "React · Vite · TypeScript · FastAPI · SQLAlchemy · Python 3.12"],
                    ["Status",    "Pipeline Active (RUS + SMOTE + Live TShark Capture)"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                      <div style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
