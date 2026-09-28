// =========================================================
// NetMine AI — Traffic Trend Line Chart
// Uses: Recharts AreaChart
// Data source: DEMO (mock/data.ts)
// =========================================================
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { TrafficTrendPoint } from "../types";

interface TrafficChartProps {
  data: TrafficTrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 6 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color, fontWeight: 500 }}>
            {p.name}: {p.value.toLocaleString()} {p.dataKey === "packetsPerSec" ? "pkt/s" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrafficChart({ data }: TrafficChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPkts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="gradAnom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
        <XAxis
          dataKey="time"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-border-muted)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}
        />
        <Area
          type="monotone"
          dataKey="packetsPerSec"
          name="Packets/sec"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#gradPkts)"
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
        />
        <Area
          type="monotone"
          dataKey="anomalies"
          name="Anomalies"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#gradAnom)"
          dot={false}
          activeDot={{ r: 4, fill: "#ef4444" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

