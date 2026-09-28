// =========================================================
// NetMine AI — Knowledge Discovery (Phase 7 updated)
//
// What this page contains:
//   Tab 1: DBSCAN Clusters — scatter plot + cluster cards
//   Tab 2: Association Rules — interactive filterable explorer
//   Tab 3: Behavioral Patterns — discovered threat patterns
//
// Phase 7: Connects to real DBSCAN and Apriori API endpoints!
// =========================================================
import { useState, useEffect } from "react";
import Topbar from "../components/layout/Topbar";
import ClusterChart from "../charts/ClusterChart";
import { mockClusters, mockAssociationRules } from "../mock/data";
import type { Cluster, AssociationRule } from "../types";

const API = "http://localhost:8000";
const TABS = ["DBSCAN Clusters", "Association Rules", "Patterns"] as const;
type Tab = typeof TABS[number];

function formatBytes(b: number) {
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b > 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${b.toFixed(0)} B`;
}

function liftColor(lift: number) {
  if (lift >= 10) return "var(--color-danger)";
  if (lift >= 5)  return "var(--color-warning)";
  return "var(--color-success)";
}

export default function KnowledgeDiscovery() {
  const [tab, setTab] = useState<Tab>("DBSCAN Clusters");
  const [minSupport, setMinSupport] = useState(0);
  const [minConf, setMinConf] = useState(0);
  const [minLift, setMinLift] = useState(0);

  // Real backend data states
  const [clusters, setClusters] = useState<Cluster[]>(mockClusters);
  const [rules, setRules] = useState<AssociationRule[]>(mockAssociationRules);
  const [isRealClusters, setIsRealClusters] = useState(false);
  const [isRealRules, setIsRealRules] = useState(false);
  const [totalFlows, setTotalFlows] = useState<number>(12000);
  const [noiseCount, setNoiseCount] = useState<number>(231);

  useEffect(() => {
    // Fetch real DBSCAN clusters
    fetch(`${API}/api/clusters`)
      .then(r => r.json())
      .then(d => {
        if (d && d.clusters && d.clusters.length > 0) {
          const mapped: Cluster[] = d.clusters.map((c: any) => ({
            id: c.id,
            label: c.label,
            size: c.size,
            description: c.description,
            avgPackets: c.avg_packets ?? c.avgPackets ?? 0,
            avgBytes: c.avg_bytes ?? c.avgBytes ?? 0,
            color: c.color,
          }));
          setClusters(mapped);
          setIsRealClusters(d.data_source === "DBSCAN_MEASURED");
          setTotalFlows(d.total_flows ?? 12000);
          setNoiseCount(d.noise_count ?? 0);
        }
      })
      .catch(() => {});

    // Fetch real Apriori rules
    fetch(`${API}/api/rules`)
      .then(r => r.json())
      .then(d => {
        if (d && d.rules && d.rules.length > 0) {
          setRules(d.rules);
          setIsRealRules(d.data_source === "APRIORI_MEASURED");
        }
      })
      .catch(() => {});
  }, []);

  const filteredRules = rules.filter(r =>
    r.support >= minSupport &&
    r.confidence >= minConf &&
    r.lift >= minLift
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
              {isRealClusters || isRealRules ? (
                <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
                  ✓ Phase 7 — Real Measured CICIDS2017 Results
                </span>
              ) : (
                <span style={{ color: "var(--color-accent-amber)" }}>DEMO DATA</span>
              )}
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
                <span className={isRealClusters ? "live-badge" : "demo-badge"}>
                  {isRealClusters ? "DBSCAN Measured" : "Demo Data"}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
                Evaluated across <strong>{totalFlows.toLocaleString()} network flows</strong>.
                Identified <strong>{clusters.filter(c => c.id !== -1).length} dense behavioral clusters</strong> and{" "}
                <strong style={{ color: "var(--color-danger)" }}>{noiseCount} noise points</strong>.
                Red points indicate flows DBSCAN isolated as geometric noise (unusual probes and port sweeps).
              </p>
              <div style={{ height: 340 }}>
                <ClusterChart clusters={clusters} />
              </div>
            </div>

            {/* Cluster cards */}
            <div className="cluster-grid">
              {clusters.map(c => (
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
                <strong style={{ color: "var(--color-accent-amber)" }}>⚠ Analytical Context:</strong>{" "}
                DBSCAN noise (cluster = -1) isolates flows that do not conform to standard density clusters.
                In NetMine AI, noise points are correlated with Isolation Forest scores to distinguish novel zero-day attacks from legitimate high-burst transfers.
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
                <span className={isRealRules ? "live-badge" : "demo-badge"}>
                  {isRealRules ? "Apriori Mined" : "Demo Data"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                {[
                  { label: "Min Support",    key: "support",  value: minSupport, set: setMinSupport,   max: 0.2,  step: 0.005 },
                  { label: "Min Confidence", key: "conf",     value: minConf,    set: setMinConf,      max: 1.0,  step: 0.02 },
                  { label: "Min Lift",       key: "lift",     value: minLift,    set: setMinLift,      max: 15,   step: 0.5  },
                ].map(s => (
                  <div className="range-group" key={s.key}>
                    <div className="range-label">
                      <span>{s.label}</span>
                      <span>{s.key === "lift" ? s.value.toFixed(1) + "×" : (s.value * 100).toFixed(1) + "%"}</span>
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
                Showing <strong style={{ color: "var(--color-text-primary)" }}>{filteredRules.length}</strong> of {rules.length} mined rules.
                {isRealRules && " Extracted from CICIDS2017 dataset via mlxtend Apriori algorithm."}
              </p>
            </div>

            {filteredRules.length === 0 ? (
              <div className="card">
                <div className="not-implemented" style={{ padding: 32 }}>
                  <p style={{ fontWeight: 600 }}>No rules match the current thresholds</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                    Try lowering the minimum support or confidence filter.
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
                        {(r.support * 100).toFixed(2)}%
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
                        {r.lift.toFixed(2)}×
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Explanation box */}
            <div className="card" style={{ marginTop: 16, padding: "14px 18px" }}>
              <h3 style={{ fontWeight: 600, marginBottom: 8, fontSize: "0.88rem" }}>Mathematical Formulation</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, fontSize: "0.8rem" }}>
                {[
                  { term: "Support", def: "Fraction of total flows containing both antecedent and consequent: Supp(X → Y) = P(X ∪ Y)." },
                  { term: "Confidence", def: "Conditional probability of consequent given antecedent: Conf(X → Y) = P(Y | X) = Supp(X ∪ Y) / Supp(X)." },
                  { term: "Lift", def: "Ratio of observed support to expected support under independence: Lift = Conf(X → Y) / Supp(Y). Values > 1 indicate significant predictive correlation." },
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
                title: "Sequential Port Scan Signature",
                desc: "Single-packet flows to high/ephemeral ports with duration < 1s and high packet rates. Confirmed by Apriori rule with 11.38x lift and 99.1% confidence.",
                confidence: "Very High (Lift 11.38×)",
                source: "Apriori Rule #1 + DBSCAN Cluster 2",
                color: "#f59e0b",
              },
              {
                title: "Volumetric DoS Flooding Signature",
                desc: "Massive packet streams targeting Web ports (80/443) with short inter-arrival times and anomalous byte volumes. Flagged by Isolation Forest with score > 0.85.",
                confidence: "Critical",
                source: "Isolation Forest + DBSCAN Cluster 0",
                color: "#ef4444",
              },
              {
                title: "Lightweight DNS Infrastructure Queries",
                desc: "Regular single-packet UDP interactions to port 53 with low byte payloads (<100B). Characterized as DBSCAN Cluster 1 (100% Benign baseline).",
                confidence: "Verified Baseline",
                source: "DBSCAN Cluster 1",
                color: "#10b981",
              },
              {
                title: "High-Throughput File Transfer Sessions",
                desc: "High byte-per-second flows with large average packet sizes (>400B). Profiled as standard data stream behavior.",
                confidence: "Normal Traffic",
                source: "DBSCAN Cluster 0",
                color: "#3b82f6",
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
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
