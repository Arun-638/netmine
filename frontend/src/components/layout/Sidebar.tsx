// =========================================================
// NetMine AI — Sidebar Navigation
// =========================================================
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Activity, AlertTriangle, Monitor,
  Globe, Brain, FlaskConical, FileText, Settings,
  Wifi, Shield,
} from "lucide-react";

interface NavSection {
  label: string;
  items: { path: string; icon: React.ReactNode; label: string }[];
}

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { path: "/",          icon: <LayoutDashboard size={16} />, label: "Dashboard"          },
      { path: "/live",      icon: <Activity        size={16} />, label: "Live Traffic"        },
      { path: "/anomalies", icon: <AlertTriangle   size={16} />, label: "Anomalies"           },
    ],
  },
  {
    label: "Network",
    items: [
      { path: "/devices",   icon: <Monitor size={16} />, label: "Devices"             },
      { path: "/protocols", icon: <Globe   size={16} />, label: "Protocol Analytics"  },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { path: "/knowledge", icon: <Brain        size={16} />, label: "Knowledge Discovery" },
      { path: "/ml",        icon: <FlaskConical size={16} />, label: "ML Analytics"        },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/reports",  icon: <FileText  size={16} />, label: "Reports"  },
      { path: "/settings", icon: <Settings  size={16} />, label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Shield size={16} color="white" />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">NetMine AI</span>
          <span className="sidebar-brand-sub">Traffic Analytics</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div className="nav-section" key={section.label}>
            <p className="nav-section-label">{section.label}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `nav-item${isActive ? " active" : ""}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wifi size={14} color="var(--color-text-muted)" />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            v0.1.0-dev
          </span>
        </div>
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--color-text-muted)",
            marginTop: 4,
          }}
        >
          Arun · Adithyan · Vaishnav
        </div>
      </div>
    </aside>
  );
}
