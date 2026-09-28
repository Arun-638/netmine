import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MetricCardData } from "../../types";
import type { ReactNode } from "react";

interface MetricCardProps extends MetricCardData {
  color?: string;
  icon?: ReactNode;
}

export default function MetricCard({ title, value, unit, change, trend, color = "#3b82f6", icon }: MetricCardProps) {
  const trendClass = trend === "up" ? "up" : trend === "down" ? "down" : "neutral";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="metric-card fade-in-up">
      <div className="metric-card-header">
        <span className="metric-card-label">{title}</span>
        {icon && (
          <div className="metric-card-icon" style={{ background: `${color}20`, color }}>
            {icon}
          </div>
        )}
      </div>
      <div className="metric-card-value">{value}</div>
      {unit && <div className="metric-card-unit">{unit}</div>}
      {change !== undefined && (
        <div className={`metric-card-change ${trendClass}`}>
          <TrendIcon size={12} />
          <span>{Math.abs(change)}% vs last hour</span>
        </div>
      )}
    </div>
  );
}
