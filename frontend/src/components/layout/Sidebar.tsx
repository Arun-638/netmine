// =========================================================
// NetMine AI — Sidebar Navigation
// =========================================================
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Activity, AlertTriangle, Monitor,
  Globe, Brain, FlaskConical, FileText, Settings,
  Wifi, Shield,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

interface NavSection {
  label: string;
  items: { path: string; icon: React.ReactNode; label: string }[];
}

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { path: "/",          icon: <LayoutDashboard size={17} />, label: "Dashboard"          },
      { path: "/live",      icon: <Activity        size={17} />, label: "Live Traffic"        },
      { path: "/anomalies", icon: <AlertTriangle   size={17} />, label: "Anomalies"           },
    ],
  },
  {
    label: "Network",
    items: [
      { path: "/devices",   icon: <Monitor size={17} />, label: "Devices"             },
      { path: "/protocols", icon: <Globe   size={17} />, label: "Protocol Analytics"  },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { path: "/knowledge", icon: <Brain        size={17} />, label: "Knowledge Discovery" },
      { path: "/ml",        icon: <FlaskConical size={17} />, label: "ML Analytics"        },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/reports",  icon: <FileText  size={17} />, label: "Reports"  },
      { path: "/settings", icon: <Settings  size={17} />, label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div
        className="sidebar-brand"
        style={{ cursor: "pointer" }}
        onClick={toggleSidebar}
        title={isCollapsed ? "Click to expand sidebar (Ctrl+B)" : "Click to collapse (Ctrl+B)"}
      >
        <div className="sidebar-brand-icon">
          <Shield size={16} color="white" />
        </div>
        {!isCollapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">NetMine AI</span>
            <span className="sidebar-brand-sub">Traffic Analytics</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div className="nav-section" key={section.label}>
            {!isCollapsed && <p className="nav-section-label">{section.label}</p>}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                title={item.label}
                className={({ isActive }) =>
                  `nav-item${isActive ? " active" : ""}`
                }
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", gap: 8 }}>
          <Wifi size={14} color="var(--color-text-muted)" />
          {!isCollapsed && (
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              v0.1.0-dev
            </span>
          )}
        </div>
        {!isCollapsed && (
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--color-text-muted)",
              marginTop: 4,
            }}
          >
            Arun · Adithyan · Vaishnav
          </div>
        )}
      </div>
    </aside>
  );
}
