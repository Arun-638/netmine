// =========================================================
// NetMine AI — Topbar
// =========================================================
import { Bell, RefreshCw } from "lucide-react";
import { mockSystemStatus } from "../../mock/data";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const now = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>
        {/* Demo mode badge */}
        <span className="demo-badge">
          {mockSystemStatus.dataSource} MODE
        </span>
      </div>

      <div className="topbar-right">
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--color-text-muted)",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {now}
        </span>
        <button
          className="btn btn-ghost"
          style={{ padding: "6px 10px" }}
          title="Refresh data"
        >
          <RefreshCw size={14} />
        </button>
        <button
          className="btn btn-ghost"
          style={{ padding: "6px 10px", position: "relative" }}
          title="Notifications"
        >
          <Bell size={14} />
          <span
            style={{
              position: "absolute",
              top: 4, right: 4,
              width: 7, height: 7,
              borderRadius: "50%",
              background: "var(--color-danger)",
              border: "1.5px solid var(--color-bg-surface)",
            }}
          />
        </button>
        <div
          style={{
            width: 32, height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "white",
            cursor: "pointer",
          }}
        >
          AR
        </div>
      </div>
    </header>
  );
}
