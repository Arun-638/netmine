// =========================================================
// NetMine AI — ML Analytics (Phase 2)
//
// Shows:
//   - 3 model status cards with detailed metric display
//   - Grouped bar chart comparing metrics (empty until Phase 6)
//   - CICIDS2017 class distribution (for student learning)
//   - Feature compatibility section
// =========================================================
import { useState } from "react";
import { FlaskConical, CheckCircle, AlertCircle } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import MLComparisonChart from "../charts/MLComparisonChart";
import { mockMLMetrics } from "../mock/data";

// Known CICIDS2017 labels (from domain knowledge — not fabricated from any experiment)
const KNOWN_LABELS = [
  { label: "BENIGN",             day: "Monday–Friday", note: "Majority class — heavy class imbalance" },
  { label: "DoS Hulk",           day: "Wednesday",     note: "" },
  { label: "PortScan",           day: "Friday",        note: "" },
  { label: "DDoS",               day: "Friday",        note: "" },
  { label: "DoS GoldenEye",      day: "Wednesday",     note: "" },
  { label: "FTP-Patator",        day: "Tuesday",       note: "" },
  { label: "SSH-Patator",        day: "Tuesday",       note: "" },
  { label: "DoS slowloris",      day: "Wednesday",     note: "" },
  { label: "DoS Slowhttptest",   day: "Wednesday",     note: "" },
  { label: "Bot",                day: "Friday",        note: "" },
  { label: "Web Attack – Brute Force", day: "Thursday", note: "" },
  { label: "Web Attack – XSS",   day: "Thursday",     note: "" },
  { label: "Infiltration",       day: "Thursday",     note: "" },
  { label: "Web Attack – SQL Injection", day: "Thursday", note: "" },
  { label: "Heartbleed",         day: "Wednesday",    note: "Very rare" },
];

// Live-compatible features (domain knowledge — no experiment needed)
const FEATURES = [
  { name: "Flow Duration",               live: true,  how: "last_pkt_time - first_pkt_time" },
  { name: "Total Fwd Packets",           live: true,  how: "count(src→dst packets)" },
  { name: "Total Backward Packets",      live: true,  how: "count(dst→src packets)" },
  { name: "Fwd Packet Length Mean",      live: true,  how: "mean(fwd payload sizes)" },
  { name: "Bwd Packet Length Mean",      live: true,  how: "mean(bwd payload sizes)" },
  { name: "Flow Bytes/s",                live: true,  how: "total_bytes / duration" },
  { name: "Flow Packets/s",              live: true,  how: "total_packets / duration" },
  { name: "Flow IAT Mean",               live: true,  how: "mean(inter-arrival times)" },
  { name: "Fwd IAT Mean",                live: true,  how: "mean(fwd inter-arrival times)" },
  { name: "Destination Port",            live: true,  how: "TCP/UDP dport field" },
  { name: "Protocol",                    live: true,  how: "IP protocol number" },
  { name: "SYN Flag Count",             live: true,  how: "count(TCP SYN flags in flow)" },
  { name: "RST Flag Count",             live: true,  how: "count(TCP RST flags)" },
  { name: "PSH Flag Count",             live: true,  how: "count(TCP PSH flags)" },
  { name: "ACK Flag Count",             live: true,  how: "count(TCP ACK flags)" },
  { name: "Active Mean",                 live: true,  how: "mean(active sub-flow durations)" },
  { name: "Idle Mean",                   live: true,  how: "mean(idle gaps between sub-flows)" },
  { name: "Subflow Fwd Bytes",           live: true,  how: "mean(fwd bytes per sub-flow)" },
  { name: "Init Win Bytes Fwd",          live: true,  how: "TCP window size in first SYN" },
  { name: "Payload Data (content)",      live: false, how: "Not used — privacy / legal concern" },
  { name: "Source IP (raw)",             live: false, how: "Excluded — not generalizable" },
];

const TABS = ["Model Status", "Feature Compatibility", "CICIDS2017 Labels"] as const;
type Tab = typeof TABS[number];

export default function MLAnalytics() {
  const [tab, setTab] = useState<Tab>("Model Status");

  return (
    <>
      <Topbar title="ML Analytics" subtitle="Supervised traffic classification pipeline" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Machine Learning Analytics</h1>
            <p className="page-header-subtitle">
              Decision Tree · Random Forest · XGBoost ·{" "}
              <span style={{ color: "var(--color-accent-purple)" }}>NOT YET EVALUATED</span>{" "}
              · Training in Phase 6
            </p>
          </div>
        </div>

        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Model Status ────────────────────────────────── */}
        {tab === "Model Status" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
              {mockMLMetrics.map(m => (
                <div className="card" key={m.model}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{m.model}</h3>
                      <span style={{
                        fontSize: "0.68rem", padding: "3px 10px", borderRadius: 20,
                        background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                        color: "var(--color-accent-purple)", fontWeight: 600, textTransform: "uppercase",
                      }}>
                        NOT TRAINED
                      </span>
                    </div>
                    <FlaskConical size={20} color="var(--color-text-muted)" />
                  </div>
                  {[
                    { label: "Accuracy",  value: m.accuracy  },
                    { label: "Precision", value: m.precision },
                    { label: "Recall",    value: m.recall    },
                    { label: "F1 Score",  value: m.f1Score   },
                  ].map(metric => (
                    <div key={metric.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{metric.label}</span>
                        <span style={{ fontSize: "0.78rem", fontFamily: '"JetBrains Mono",monospace', color: "var(--color-text-muted)" }}>
                          —
                        </span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: "var(--color-bg-hover)" }} />
                    </div>
                  ))}
                  <p style={{ fontSize: "0.72rem", color: "var(--color-accent-amber)", marginTop: 8 }}>
                    Metrics will be populated after Phase 6 training.
                    No values are fabricated.
                  </p>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Model Comparison Chart</span>
                <span className="not-implemented-badge" style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: "0.68rem", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "var(--color-accent-purple)", fontWeight: 600, textTransform: "uppercase" }}>
                  NOT YET EVALUATED
                </span>
              </div>
              <div style={{ height: 280 }}>
                <MLComparisonChart data={mockMLMetrics.map(m => ({
                  model: m.model, accuracy: m.accuracy, precision: m.precision,
                  recall: m.recall, f1Score: m.f1Score,
                }))} />
              </div>
            </div>
          </>
        )}

        {/* ── Feature Compatibility ───────────────────────── */}
        {tab === "Feature Compatibility" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">CICIDS2017 Features — Live Compatibility Analysis</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
              This is a critical design requirement. We only train on features that can be{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>reproduced from live TShark captures</strong>.
              If a feature cannot be extracted live, it is excluded from the model.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Live-Compatible</th>
                    <th>Extraction Method</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map(f => (
                    <tr key={f.name}>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.8rem", color: "var(--color-text-primary)" }}>
                        {f.name}
                      </td>
                      <td>
                        {f.live
                          ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color="var(--color-success)" /> <span style={{ color: "var(--color-success)", fontSize: "0.8rem", fontWeight: 600 }}>YES</span></div>
                          : <div style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={14} color="var(--color-danger)" /> <span style={{ color: "var(--color-danger)", fontSize: "0.8rem", fontWeight: 600 }}>EXCLUDED</span></div>
                        }
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontFamily: '"JetBrains Mono",monospace' }}>
                        {f.how}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CICIDS2017 Labels ───────────────────────────── */}
        {tab === "CICIDS2017 Labels" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Known Traffic Classes in CICIDS2017</span>
              <span className="demo-badge">Domain Knowledge</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              These labels are known from the dataset documentation — not from running any experiment yet.
              Class distribution will be measured and plotted in Phase 5 (CICIDS2017 Exploration).
            </p>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Label</th><th>Capture Day</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {KNOWN_LABELS.map((l, i) => (
                  <tr key={l.label}>
                    <td style={{ color: "var(--color-text-muted)", fontFamily: '"JetBrains Mono",monospace' }}>{i + 1}</td>
                    <td>
                      <span className={l.label === "BENIGN" ? "chip chip-green" : "chip chip-red"}>
                        {l.label}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{l.day}</td>
                    <td style={{ color: "var(--color-accent-amber)", fontSize: "0.78rem" }}>{l.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  );
}
