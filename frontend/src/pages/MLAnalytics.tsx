// =========================================================
// NetMine AI -- ML Analytics (Phase 6 updated)
//
// Phase 6 complete: fetches REAL trained model metrics
// from GET /api/ml/metrics (reads ml_results.json).
//
// Shows:
//   - 3 model status cards with real accuracy/F1 scores
//   - Grouped bar chart comparing all 3 models (real data)
//   - CICIDS2017 class distribution with real row counts
//   - Feature compatibility section
// =========================================================
import { useState, useEffect } from "react";
import { FlaskConical, CheckCircle, AlertCircle, Loader } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import MLComparisonChart from "../charts/MLComparisonChart";

// ── Types ──────────────────────────────────────────────────
interface MLModel {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  status: string;
  trained_at?: string;
  dataset?: string;
}

interface MLMetricsList {
  models: MLModel[];
  best_model: string | null;
  data_source: string;
}

// ── Real class distribution from Phase 5 EDA ──────────────
const CLASS_DIST = [
  { label: "BENIGN",                    count: 2148386, day: "Mon–Fri",   pct: 83.46, note: "Majority — heavy imbalance" },
  { label: "DoS Hulk",                  count: 172849,  day: "Wednesday", pct: 6.71,  note: "" },
  { label: "DDoS",                      count: 128016,  day: "Friday",    pct: 4.97,  note: "" },
  { label: "PortScan",                  count: 90819,   day: "Friday",    pct: 3.53,  note: "" },
  { label: "DoS GoldenEye",             count: 10286,   day: "Wednesday", pct: 0.40,  note: "" },
  { label: "FTP-Patator",               count: 5933,    day: "Tuesday",   pct: 0.23,  note: "" },
  { label: "DoS slowloris",             count: 5385,    day: "Wednesday", pct: 0.21,  note: "" },
  { label: "DoS Slowhttptest",          count: 5228,    day: "Wednesday", pct: 0.20,  note: "" },
  { label: "SSH-Patator",               count: 3219,    day: "Tuesday",   pct: 0.13,  note: "" },
  { label: "Bot",                       count: 1953,    day: "Friday",    pct: 0.08,  note: "" },
  { label: "Web Attack – Brute Force",  count: 1470,    day: "Thursday",  pct: 0.06,  note: "" },
  { label: "Web Attack – XSS",          count: 652,     day: "Thursday",  pct: 0.03,  note: "" },
  { label: "Infiltration",              count: 36,      day: "Thursday",  pct: 0.00,  note: "" },
  { label: "Web Attack – SQL Injection",count: 21,      day: "Thursday",  pct: 0.00,  note: "" },
  { label: "Heartbleed",                count: 11,      day: "Wednesday", pct: 0.00,  note: "Very rare (11 samples)" },
];

const FEATURES = [
  { name: "Flow Duration",           live: true,  how: "last_pkt_time - first_pkt_time" },
  { name: "Total Fwd Packets",       live: true,  how: "count(src→dst packets)" },
  { name: "Total Backward Packets",  live: true,  how: "count(dst→src packets)" },
  { name: "Fwd Packet Length Mean",  live: true,  how: "mean(fwd payload sizes)" },
  { name: "Flow Bytes/s",            live: true,  how: "total_bytes / duration" },
  { name: "Flow Packets/s",          live: true,  how: "total_packets / duration" },
  { name: "SYN Flag Count",          live: true,  how: "count SYN flags in flow" },
  { name: "ACK Flag Count",          live: true,  how: "count ACK flags" },
  { name: "Fwd Avg Bytes/Bulk",      live: false, how: "Needs bulk tracking — not in basic TShark" },
  { name: "Init_Win_bytes_forward",  live: true,  how: "TCP window size from handshake" },
];

const MODEL_COLORS: Record<string, string> = {
  "Decision Tree": "#3b82f6",
  "Random Forest": "#22c55e",
  "XGBoost":       "#f59e0b",
};

const API = "http://localhost:8000";

export default function MLAnalytics() {
  const [data,    setData]    = useState<MLMetricsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/ml/metrics`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Convert backend response to chart format
  const chartData = data?.models.map(m => ({
    model:     m.model,
    accuracy:  m.accuracy,
    precision: m.precision,
    recall:    m.recall,
    f1Score:   m.f1_score,
  })) ?? [];

  const isRealData = data?.data_source === "CICIDS2017_TRAINED";

  return (
    <>
      <Topbar title="ML Analytics" subtitle="Model performance on CICIDS2017 dataset" />
      <div className="page-content fade-in-up">

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">ML Model Performance</h1>
            <p className="page-header-subtitle">
              Dataset: <strong>CICIDS2017</strong> ·{" "}
              {isRealData
                ? <span style={{ color: "var(--color-success)" }}>✓ Real trained results</span>
                : <span style={{ color: "var(--color-accent-amber)" }}>⚠ Not yet trained</span>}
              {data?.models[0]?.trained_at && (
                <span style={{ color: "var(--color-text-muted)", marginLeft: 8 }}>
                  · Trained {data.models[0].trained_at}
                </span>
              )}
            </p>
          </div>
          {data?.best_model && (
            <div style={{
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 10, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <CheckCircle size={16} color="var(--color-success)" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-success)" }}>
                Best: {data.best_model} ({((data.models.find(m => m.model === data.best_model)?.f1_score ?? 0) * 100).toFixed(2)}% F1)
              </span>
            </div>
          )}
        </div>

        {/* Model cards */}
        {loading ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <Loader size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <p>Loading model metrics from backend...</p>
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--color-danger)" }}>
            <AlertCircle size={24} style={{ margin: "0 auto 12px" }} />
            <p>Backend not reachable: {error}</p>
            <p style={{ fontSize: "0.8rem", marginTop: 8, color: "var(--color-text-muted)" }}>
              Run: <code>.\start_backend.ps1</code>
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {(data?.models ?? []).map(m => {
              const isBest = m.model === data?.best_model;
              const color  = MODEL_COLORS[m.model] ?? "#6b7280";
              return (
                <div key={m.model} className="card" style={{
                  borderTop: `3px solid ${color}`,
                  boxShadow: isBest ? `0 0 0 1px ${color}40` : undefined,
                  position: "relative",
                }}>
                  {isBest && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      background: "rgba(34,197,94,0.12)", color: "var(--color-success)",
                      borderRadius: 6, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700,
                    }}>BEST</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <FlaskConical size={18} color={color} />
                    <span style={{ fontWeight: 700 }}>{m.model}</span>
                  </div>
                  {[
                    { label: "Accuracy",  val: m.accuracy },
                    { label: "Precision", val: m.precision },
                    { label: "Recall",    val: m.recall },
                    { label: "F1 Score",  val: m.f1_score },
                  ].map(metric => (
                    <div key={metric.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.78rem" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>{metric.label}</span>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, color }}>
                          {(metric.val * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "var(--color-bg-hover)" }}>
                        <div style={{
                          width: `${metric.val * 100}%`, height: "100%",
                          borderRadius: 3, background: color, transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, fontSize: "0.72rem", color: "var(--color-text-muted)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      background: "rgba(34,197,94,0.1)", color: "var(--color-success)",
                    }}>
                      {m.status}
                    </span>
                    <span>{m.dataset}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comparison chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">Model Metric Comparison</span>
              <span className={isRealData ? "live-badge" : "demo-badge"}>
                {isRealData ? "Real Results" : "Demo"}
              </span>
            </div>
            <div style={{ height: 300, width: "100%", marginTop: 12 }}>
              <MLComparisonChart data={chartData} />
            </div>
          </div>
        )}

        {/* Class distribution — real numbers from Phase 5 EDA */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">CICIDS2017 Class Distribution</span>
            <span className="live-badge">Phase 5 EDA — Real Counts</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 14 }}>
            Measured from all 8 CSV files: <strong>2,830,743 total rows</strong>, 256,479 duplicates removed → <strong>2,574,264 clean rows</strong>.
            BENIGN undersampled to 518,547 (3× DoS Hulk) during training.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Label</th><th>Day</th><th>Count</th><th>% of Total</th><th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {CLASS_DIST.map(c => (
                  <tr key={c.label}>
                    <td style={{ fontWeight: 600 }}>{c.label}</td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{c.day}</td>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{c.count.toLocaleString()}</td>
                    <td style={{ fontFamily: '"JetBrains Mono",monospace' }}>{c.pct.toFixed(2)}%</td>
                    <td style={{ minWidth: 180 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--color-bg-hover)" }}>
                          <div style={{
                            width: `${Math.max(c.pct / 85 * 100, c.pct > 0 ? 2 : 0)}%`,
                            height: "100%", borderRadius: 3,
                            background: c.label === "BENIGN" ? "var(--color-success)" : "var(--color-accent-primary)",
                          }} />
                        </div>
                        {c.note && <span style={{ fontSize: "0.68rem", color: "var(--color-accent-amber)" }}>{c.note}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature compatibility */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Feature Live-Compatibility (Phase 9 readiness)</span>
            <span className="demo-badge">Domain Analysis</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 14 }}>
            Features used in training vs. what TShark can compute in real-time.
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Feature</th><th>Live Computable?</th><th>How to Extract</th></tr>
            </thead>
            <tbody>
              {FEATURES.map(f => (
                <tr key={f.name}>
                  <td style={{ fontWeight: 600 }}>{f.name}</td>
                  <td>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem",
                      background: f.live ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: f.live ? "var(--color-success)" : "var(--color-danger)",
                    }}>
                      {f.live ? "✓ Yes" : "✗ No"}
                    </span>
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
    </>
  );
}
