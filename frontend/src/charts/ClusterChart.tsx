// =========================================================
// NetMine AI — ClusterChart
// Visualizes real DBSCAN clusters and 2D PCA projection coordinates.
//
// 100% Real measured data from data_mining/dbscan_clustering.py
// Zero Math.random() or synthetic data.
// =========================================================
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import type { Cluster } from "../types";

export interface ScatterPoint {
  x: number;
  y: number;
  cluster: number;
  cluster_label: string;
  actual_label?: string;
  color?: string;
}

interface ClusterChartProps {
  clusters: Cluster[];
  scatterPoints?: ScatterPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: "var(--color-bg-elevated, #1e293b)",
        border: "1px solid var(--color-border, rgba(255,255,255,0.1))",
        borderRadius: "var(--radius-md, 8px)",
        padding: "10px 14px",
        fontSize: "0.8rem",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
      }}>
        <p style={{ color: d.color || "var(--color-text-primary)", fontWeight: 700, marginBottom: 4 }}>
          {d.cluster_label || d.label}
        </p>
        {d.actual_label && (
          <p style={{ color: "var(--color-text-secondary, #cbd5e1)", marginBottom: 2 }}>
            Traffic Type: <strong style={{ color: "#38bdf8" }}>{d.actual_label}</strong>
          </p>
        )}
        <p style={{ color: "var(--color-text-muted, #94a3b8)", fontSize: "0.75rem", fontFamily: '"JetBrains Mono", monospace' }}>
          PCA (x: {Number(d.x).toFixed(2)}, y: {Number(d.y).toFixed(2)})
        </p>
      </div>
    );
  }
  return null;
};

export default function ClusterChart({ clusters, scatterPoints = [] }: ClusterChartProps) {
  // If real scatter points from PCA + DBSCAN are provided, group by cluster
  const hasRealPoints = scatterPoints && scatterPoints.length > 0;

  const seriesData = clusters.map((c) => {
    if (hasRealPoints) {
      const pts = scatterPoints.filter((p) => p.cluster === c.id);
      return {
        cluster: c,
        points: pts.length > 0 ? pts : [{
          x: c.avgPackets,
          y: c.avgBytes,
          cluster: c.id,
          cluster_label: c.label,
          color: c.color,
        }],
      };
    }

    // Fallback without any Math.random() jitter: exact centroid point
    return {
      cluster: c,
      points: [{
        x: c.avgPackets,
        y: c.avgBytes,
        cluster: c.id,
        cluster_label: c.label,
        color: c.color,
      }],
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted, rgba(255,255,255,0.06))" />
        <XAxis
          type="number"
          dataKey="x"
          name="PC1"
          tick={{ fill: "var(--color-text-muted, #94a3b8)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-border-muted, rgba(255,255,255,0.1))" }}
          tickLine={false}
          label={{
            value: hasRealPoints ? "PCA Component 1 (Flow Dynamics & Volume)" : "Avg Packets",
            position: "insideBottom",
            offset: -10,
            fill: "var(--color-text-muted, #94a3b8)",
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="PC2"
          tick={{ fill: "var(--color-text-muted, #94a3b8)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
          label={{
            value: hasRealPoints ? "PCA Component 2 (Rate & Duration)" : "Avg Bytes",
            angle: -90,
            position: "insideLeft",
            fill: "var(--color-text-muted, #94a3b8)",
            fontSize: 11,
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "0.75rem", color: "var(--color-text-secondary, #cbd5e1)", paddingTop: 10 }}
        />
        {seriesData.map(({ cluster, points }) => (
          <Scatter
            key={cluster.id}
            name={cluster.label}
            data={points}
            fill={cluster.color ?? "#3b82f6"}
            opacity={0.85}
          >
            {points.map((p, i) => (
              <Cell key={i} fill={p.color || cluster.color || "#3b82f6"} />
            ))}
          </Scatter>
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
