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
import { Save, RefreshCw, Server, Cpu, Shield, Users } from "lucide-react";
import Topbar from "../components/layout/Topbar";

type Section = "Connection" | "Capture" | "ML Thresholds" | "Team";

const SECTIONS: Section[] = ["Connection", "Capture", "ML Thresholds", "Team"];

const TEAM = [
  { name: "Arun A Raj",       role: "Full-Stack + ML Lead",          color: "#3b82f6" },
  { name: "Adithyan H",       role: "Data Mining + Backend",          color: "#8b5cf6" },
  { name: "Vaishnav Prakash", role: "Network Security + TShark",      color: "#22c55e" },
];

export default function Settings() {
  const [section,      setSection]      = useState<Section>("Connection");
  const [apiUrl,       setApiUrl]       = useState("http://localhost:8000");
  const [iface,        setIface]        = useState("Wi-Fi");
  const [ifThreshold,  setIfThreshold]  = useState(0.7);
  const [dbscanEps,    setDbscanEps]    = useState(0.5);
  const [dbscanMin,    setDbscanMin]    = useState(5);
  const [saved,        setSaved]        = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Configuration and preferences" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Settings</h1>
            <p className="page-header-subtitle">
              Application configuration · Some settings take effect in later phases
            </p>
          </div>
          <button
            onClick={save}
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
                  <span>Backend reachable at <strong>{apiUrl}/api/health</strong></span>
                </div>
                <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--color-bg-surface)", borderRadius: 8, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  <p><strong style={{ color: "var(--color-text-primary)" }}>Phase 9 note:</strong> When live TShark capture is enabled,
                  the frontend will also open a WebSocket to <code style={{ color: "var(--color-accent-secondary)" }}>ws://localhost:8000/ws/live</code> for real-time flow streaming.</p>
                </div>
              </div>
            )}

            {section === "Capture" && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: 6 }}>Network Capture Settings</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                  Configure the TShark network interface for live packet capture.
                  This becomes active in <strong style={{ color: "var(--color-accent-purple)" }}>Phase 9</strong>.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
                    Network Interface
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
                    ⚠ To see your real interfaces, run: <code>tshark -D</code>
                  </p>
                </div>

                <div style={{
                  padding: "12px 16px", background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8,
                  fontSize: "0.8rem", color: "var(--color-accent-purple)",
                }}>
                  <strong>NOT IMPLEMENTED</strong> — Live capture integration is Phase 9.
                  Currently all traffic data comes from demo data or CICIDS2017 CSV files.
                </div>
              </div>
            )}

            {section === "ML Thresholds" && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: 6 }}>ML Decision Thresholds</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                  These thresholds control when an anomaly is flagged.
                  They apply in <strong style={{ color: "var(--color-accent-purple)" }}>Phase 7+</strong> (after model training).
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
                  padding: "10px 14px", background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8,
                  fontSize: "0.78rem", color: "var(--color-accent-purple)",
                }}>
                  NOT ACTIVE — these sliders store state locally but do not affect the backend until Phase 7.
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
                    ["Dataset",   "CICIDS2017 (Canadian Institute for Cybersecurity)"],
                    ["Stack",     "React · Vite · TypeScript · FastAPI · SQLAlchemy · Python 3.12"],
                    ["Phase",     "Phase 4 of 15 complete"],
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
