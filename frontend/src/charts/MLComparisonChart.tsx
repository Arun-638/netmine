// =========================================================
// NetMine AI — MLComparisonChart
// Grouped bar chart comparing ML model metrics.
// Shows "NOT YET EVALUATED" state when no data is available.
// =========================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface MLComparisonData {
  model: string;
  accuracy:  number;
  precision: number;
  recall:    number;
  f1Score:   number;
}

interface MLComparisonChartProps {
  data: MLComparisonData[];
}

export default function MLComparisonChart({ data }: MLComparisonChartProps) {
  const allZero = data.every(d => d.accuracy === 0);

  if (allZero) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100%", gap: 12,
        color: "var(--color-text-muted)",
      }}>
        <div style={{
          width: 48, height: 48,
          border: "2px dashed var(--color-border)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.4rem",
        }}>
          📊
        </div>
        <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>NOT YET EVALUATED</p>
        <p style={{ fontSize: "0.78rem", textAlign: "center", maxWidth: 280 }}>
          Models will be trained in Phase 6 using CICIDS2017.
          Real metrics will replace this chart.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
        <XAxis dataKey="model" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 1]} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v*100).toFixed(0)}%`} width={44} />
        <Tooltip formatter={(v: unknown): string => typeof v === "number" ? `${(v*100).toFixed(1)}%` : String(v)} contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }} />
        <Bar dataKey="accuracy"  name="Accuracy"  fill="#3b82f6" radius={[3,3,0,0]} />
        <Bar dataKey="precision" name="Precision" fill="#8b5cf6" radius={[3,3,0,0]} />
        <Bar dataKey="recall"    name="Recall"    fill="#22c55e" radius={[3,3,0,0]} />
        <Bar dataKey="f1Score"   name="F1 Score"  fill="#f59e0b" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
