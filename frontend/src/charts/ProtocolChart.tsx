// =========================================================
// NetMine AI — Protocol Distribution Pie Chart
// Uses: Recharts PieChart
// Data source: DEMO (mock/data.ts)
// =========================================================
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ProtocolStat } from "../types";

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b"];

interface ProtocolChartProps {
  data: ProtocolStat[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "10px 14px",
          fontSize: "0.8rem",
        }}
      >
        <p style={{ color: "var(--color-text-primary)", fontWeight: 600, marginBottom: 4 }}>
          {d.protocol}
        </p>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Packets: {d.packets.toLocaleString()}
        </p>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Share: {d.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

export default function ProtocolChart({ data }: ProtocolChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="percentage"
          nameKey="protocol"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="70%"
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

