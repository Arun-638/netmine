// =========================================================
// NetMine AI — ClusterChart
// Visualizes DBSCAN cluster output as a scatter plot.
//
// Axes: packets (x) vs bytes (y), colour = cluster id.
// In Phase 7, real DBSCAN coordinates will replace mock data.
// =========================================================
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import type { Cluster } from "../types";

// Generate scatter points per cluster for demo visualization
function generateClusterPoints(cluster: Cluster) {
  const cx = cluster.avgPackets;
  const cy = cluster.avgBytes;
  const n  = Math.min(cluster.size, 80); // cap for performance
  return Array.from({ length: n }, () => ({
    x: Math.max(1, cx + (Math.random() - 0.5) * cx * 1.2),
    y: Math.max(1, cy + (Math.random() - 0.5) * cy * 1.0),
    cluster: cluster.id,
    label:   cluster.label,
  }));
}

interface ClusterChartProps {
  clusters: Cluster[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: "0.8rem",
      }}>
        <p style={{ color: "var(--color-text-primary)", fontWeight: 600, marginBottom: 4 }}>
          {d.label}
        </p>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Packets: <strong>{Math.round(d.x)}</strong>
        </p>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Bytes: <strong>{Math.round(d.y).toLocaleString()}</strong>
        </p>
        <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: "0.72rem" }}>
          ⚠ DEMO DATA — not real DBSCAN output
        </p>
      </div>
    );
  }
  return null;
};

export default function ClusterChart({ clusters }: ClusterChartProps) {
  const seriesData = clusters.map(c => ({
    cluster: c,
    points:  generateClusterPoints(c),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
        <XAxis
          type="number"
          dataKey="x"
          name="Packets"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-border-muted)" }}
          tickLine={false}
          label={{ value: "Avg Packets", position: "insideBottom", offset: -2, fill: "var(--color-text-muted)", fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Bytes"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={v => v > 1000 ? `${(v/1000).toFixed(0)}K` : `${v}`}
          label={{ value: "Avg Bytes", angle: -90, position: "insideLeft", fill: "var(--color-text-muted)", fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}
        />
        {seriesData.map(({ cluster, points }) => (
          <Scatter
            key={cluster.id}
            name={cluster.label}
            data={points}
            fill={cluster.color ?? "#3b82f6"}
            opacity={0.75}
          >
            {points.map((_, i) => (
              <Cell key={i} fill={cluster.color ?? "#3b82f6"} />
            ))}
          </Scatter>
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
