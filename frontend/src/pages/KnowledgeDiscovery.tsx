// =========================================================
// NetMine AI — Knowledge Discovery (Phase 2)
//
// What this page contains:
//   Tab 1: DBSCAN Clusters — scatter plot + cluster cards
//   Tab 2: Association Rules — interactive filterable explorer
//   Tab 3: Behavioral Patterns — static patterns
//
// All data is DEMO. Real data comes from Phase 7.
// =========================================================
import { useState } from "react";
import Topbar from "../components/layout/Topbar";
import ClusterChart from "../charts/ClusterChart";
import { mockClusters, mockAssociationRules } from "../mock/data";

const TABS = ["DBSCAN Clusters", "Association Rules", "Patterns"] as const;
type Tab = typeof TABS[number];

function formatBytes(b: number) {
  if (b > 1e6) return `${(b/1e6).toFixed(1)} MB`;
  if (b > 1e3) return `${(b/1e3).toFixed(1)} KB`;
  return `${b} B`;
}

function liftColor(lift: number) {
  if (lift >= 10) return "var(--color-danger)";
  if (lift >= 5)  return "var(--color-warning)";
  return "var(--color-success)";
}

export default function KnowledgeDiscovery() {
  const [tab,          setTab]          = useState<Tab>("DBSCAN Clusters");
  const [minSupport,   setMinSupport]   = useState(0);
  const [minConf,      setMinConf]      = useState(0);
  const [minLift,      setMinLift]      = useState(0);

  const filteredRules = mockAssociationRules.filter(r =>
    r.support    >= minSupport &&
    r.confidence >= minConf    &&
    r.lift       >= minLift
  );

  return (
    <>
      <Topbar title="Knowledge Discovery" subtitle="DBSCAN · Association Rules · Behavioral Patterns" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Knowledge Discovery</h1>
            <p className="page-header-subtitle">
              Data Mining results ·{" "}
              <span style={{ color: "var(--color-accent-amber)" }}>DEMO DATA</span>{" "}
              · Real results in{" "}
              <span style={{ color: "var(--color-accent-purple)" }}>Phase 7</span>
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t}
              className={`tab-btn${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── DBSCAN ─────────────────────────────────────── */}
        {tab === "DBSCAN Clusters" && (
          <div>
            {/* Cluster scatter plot */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title">Cluster Scatter Plot (Packets vs Bytes)</span>
                <span className="demo-badge">Demo Data</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
                Each point represents a flow. Colour = cluster assignment.
                Red points (Noise) are flows DBSCAN could not assign to any cluster.
                These may be anomalous — but require further investigation before labelling as attacks.
              </p>
              <div style={{ height: 340 }}>
                <ClusterChart clusters={mockClusters} />
              </div>
            </div>

            {/* Cluster cards */}
            <div className="cluster-grid">
              {mockClusters.map(c => (
                <div
                  key={c.id}
                  className="cluster-card"
                  style={{
                    border: `1px solid ${c.color ?? "#3b82f6"}30`,
                    borderLeft: `3px solid ${c.color ?? "#3b82f6"}`,
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c.color ?? "#3b82f6", opacity: 0.6 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--color-text-primary)" }}>
                      {c.label}
                    </span>
                    <span style={{
                      fontSize: "0.68rem", padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                      background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}40`,
                    }}>
                      {c.id === -1 ? "NOISE" : `C-${c.id}`}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
                    {c.description}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Flows",       value: c.size.toLocaleString() },
                      { label: "Avg Packets", value: c.avgPackets.toLocaleString() },
                      { label: "Avg Bytes",   value: formatBytes(c.avgBytes) },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: "var(--color-bg-surface)", borderRadius: 6, padding: "6px 10px" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 2 }}>{stat.label}</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, fontFamily: '"JetBrains Mono",monospace', color: "var(--color-text-primary)" }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 16, padding: "14px 18px" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--color-accent-amber)" }}>⚠ Important:</strong>{" "}
                DBSCAN noise (cluster = -1) means a flow did not fit any cluster geometrically.
                This does <em>not</em> automatically mean it is malicious.
                It requires correlation with other signals (Isolation Forest score, port context, timing).
                We label these as <strong>"Anomalous / Unusual Behavior"</strong> only.
              </p>
            </div>
          </div>
        )}

        {/* ── Association Rules ──────────────────────────── */}
        {tab === "Association Rules" && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title">Threshold Filters</span>
                <span className="demo-badge">Demo Data</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                {[
                  { label: "Min Support",    key: "support",  value: minSupport, set: setMinSupport,   max: 0.5,  step: 0.01 },
                  { label: "Min Confidence", key: "conf",     value: minConf,    set: setMinConf,      max: 1.0,  step: 0.01 },
                  { label: "Min Lift",       key: "lift",     value: minLift,    set: setMinLift,      max: 20,   step: 0.5  },
                ].map(s => (
                  <div className="range-group" key={s.key}>
                    <div className="range-label">
                      <span>{s.label}</span>
                      <span>{s.key === "lift" ? s.value.toFixed(1) + "x" : (s.value * (s.key === "lift" ? 1 : 100)).toFixed(0) + (s.key === "lift" ? "" : "%")}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={s.max}
                      step={s.step}
                      value={s.value}
                      onChange={e => s.set(parseFloat(e.target.value))}
                    />
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                Showing <strong style={{ color: "var(--color-text-primary)" }}>{filteredRules.length}</strong> of {mockAssociationRules.length} rules.
                In Phase 7, these will be real Apriori rules mined from CICIDS2017 flows.
              </p>
            </div>

            {filteredRules.length === 0 ? (
              <div className="card">
                <div className="not-implemented" style={{ padding: 32 }}>
                  <p style={{ fontWeight: 600 }}>No rules match the current thresholds</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                    Try lowering the minimum support or confidence.
                  </p>
                </div>
              </div>
            ) : (
              filteredRules.map(r => (
                <div className="rule-card" key={r.id}>
                  {/* Antecedent chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                    {r.antecedent.map(a => (
                      <span key={a} className="chip chip-cyan">{a}</span>
                    ))}
                  </div>

                  <span className="rule-arrow">⟹</span>

                  {/* Consequent chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                    {r.consequent.map(c => (
                      <span key={c} className="chip chip-purple">{c}</span>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="rule-metrics">
                    <div className="rule-metric">
                      <span className="rule-metric-label">Support</span>
                      <span className="rule-metric-value" style={{ color: "var(--color-accent-secondary)" }}>
                        {(r.support * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="rule-metric">
                      <span className="rule-metric-label">Confidence</span>
                      <span className="rule-metric-value" style={{ color: "var(--color-accent-primary)" }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="rule-metric">
                      <span className="rule-metric-label">Lift</span>
                      <span className="rule-metric-value" style={{ color: liftColor(r.lift) }}>
                        {r.lift.toFixed(1)}×
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Explanation box */}
            <div className="card" style={{ marginTop: 16, padding: "14px 18px" }}>
              <h3 style={{ fontWeight: 600, marginBottom: 8, fontSize: "0.88rem" }}>What these metrics mean</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, fontSize: "0.8rem" }}>
                {[
                  { term: "Support", def: "Fraction of flows in the dataset that contain both antecedent AND consequent." },
                  { term: "Confidence", def: "Given antecedent is present, how often the consequent also appears. P(consequent | antecedent)." },
                  { term: "Lift", def: "How much more likely the consequent is given the antecedent vs. random chance. Lift > 1 = positive correlation." },
                ].map(m => (
                  <div key={m.term}>
                    <p style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{m.term}</p>
                    <p style={{ color: "var(--color-text-muted)", lineHeight: 1.5 }}>{m.def}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Patterns ───────────────────────────────────── */}
        {tab === "Patterns" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              {
                title: "High-Port SSH Brute Force Pattern",
                desc: "Repeated TCP flows to port 22 with small packet sizes and very short durations. High packet-per-flow ratio. Consistent with automated SSH login attempts.",
                confidence: "High",
                source: "Association Rules + DBSCAN",
                color: "#ef4444",
              },
              {
                title: "Background DNS Polling",
                desc: "Short UDP flows to port 53 occurring at regular intervals (every 60–300 seconds). Packet count = 1–2. Consistent with OS/app DNS TTL refresh.",
                confidence: "Very High",
                source: "DBSCAN Cluster 1",
                color: "#22c55e",
              },
              {
                title: "CDN HTTPS Bulk Transfer",
                desc: "Long-duration TCP flows to port 443 with high byte counts and moderate packet rates. Destination IPs resolve to known CDN ranges.",
                confidence: "High",
                source: "DBSCAN Cluster 0 + Cluster 2",
                color: "#3b82f6",
              },
              {
                title: "Sequential Port Scan Indicator",
                desc: "Single-packet TCP flows to incrementally increasing destination ports from the same source. Duration < 0.1s per flow. SYN-only flags.",
                confidence: "Very High",
                source: "Association Rules",
                color: "#f59e0b",
              },
            ].map(p => (
              <div
                key={p.title}
                className="card"
                style={{ borderLeft: `3px solid ${p.color}` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--color-text-primary)" }}>
                    {p.title}
                  </h3>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                    background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40`,
                  }}>
                    {p.confidence}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
                  {p.desc}
                </p>
                <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  Source: <span style={{ color: "var(--color-accent-secondary)" }}>{p.source}</span>
                </p>
                <p style={{ fontSize: "0.68rem", color: "var(--color-accent-amber)", marginTop: 6 }}>
                  ⚠ DEMO — will be replaced with real mined patterns in Phase 7
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
