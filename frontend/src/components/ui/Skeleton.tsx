import React from 'react';

export function Skeleton({ style, className = "" }: { style?: React.CSSProperties, className?: string }) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        background: "var(--color-bg-surface)",
        borderRadius: "var(--radius-md)",
        animation: "pulse 1.5s infinite",
        ...style
      }}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Skeleton style={{ width: 24, height: 24, borderRadius: "50%" }} />
        <Skeleton style={{ width: 100, height: 16 }} />
      </div>
      <Skeleton style={{ width: 140, height: 32, marginTop: "8px" }} />
      <Skeleton style={{ width: 80, height: 14 }} />
    </div>
  );
}
