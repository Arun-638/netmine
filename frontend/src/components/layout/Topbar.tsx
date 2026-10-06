// =========================================================
// NetMine AI — Topbar
// Includes Sidebar Toggle Button on the top left
// =========================================================
import { useState, useEffect } from "react";
import { Bell, RefreshCw, PanelLeft } from "lucide-react";
import { getApiUrl } from "../../services/api";
import { useSidebar } from "../../context/SidebarContext";

const API = getApiUrl();

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API}/api/capture/status`);
        if (res.ok) {
          const data = await res.json();
          setIsCapturing(Boolean(data.active));
        }
      } catch {
        // ignore
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Professional top-left sidebar collapse toggle */}
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>

        {/* Live status badge */}
        <span
          className="live-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: isCapturing ? "rgba(16, 185, 129, 0.12)" : "rgba(59, 130, 246, 0.1)",
            border: isCapturing ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(59, 130, 246, 0.25)",
            color: isCapturing ? "var(--color-success)" : "var(--color-accent-blue)",
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "0.74rem",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isCapturing ? "var(--color-success)" : "var(--color-accent-blue)",
              boxShadow: isCapturing ? "0 0 8px var(--color-success)" : "none",
            }}
          />
          {isCapturing ? "LIVE CAPTURE" : "ENGINE READY"}
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
          {timeStr}
        </span>
        <button
          className="btn btn-ghost"
          style={{ padding: "6px 10px" }}
          title="Refresh data"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </header>
  );
}
