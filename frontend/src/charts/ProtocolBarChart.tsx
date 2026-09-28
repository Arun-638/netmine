// =========================================================
// NetMine AI — ProtocolBarChart
// Horizontal bar chart for protocol packet counts.
// =========================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { ProtocolStat } from "../types";

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b"];

interface Props { data: ProtocolStat[] }

export default function ProtocolBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
        <YAxis type="category" dataKey="protocol" tick={{ fill: "var(--color-text-secondary)", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          formatter={(v: unknown): string => typeof v === "number" ? `${v.toLocaleString()} packets` : String(v)}
          contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 8 }}
        />
        <Bar dataKey="packets" radius={[0,4,4,0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
