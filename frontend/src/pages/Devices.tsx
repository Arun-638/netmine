// =========================================================
// NetMine AI — Devices Page
// 100% Live Devices — Discovered via Live Packet Capture Engine
// =========================================================
import { useState, useEffect, useCallback } from "react";
import { Monitor, AlertTriangle, Trash2, RefreshCw, Radio, ShieldAlert } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { Link } from "react-router-dom";
import { getApiUrl } from "../services/api";

const API = getApiUrl();

interface LiveDevice {
  id: string;
  ip: string;
  mac?: string;
  hostname?: string;
  firstSeen?: string;
  lastSeen?: string;
  first_seen?: string;
  last_seen?: string;
  totalBytes?: number;
  totalPackets?: number;
  total_bytes?: number;
  total_packets?: number;
  protocols: string[];
  status: "active" | "inactive" | "suspicious";
}

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function Devices() {
  const [devices, setDevices] = useState<LiveDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clearing, setClearing] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/devices`);
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch {
      // Keep previous list on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 2500);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleClearDevices = async () => {
    if (!window.confirm("Clear all discovered devices from memory and database?")) return;
    setClearing(true);
    try {
      const res = await fetch(`${API}/api/devices/clear`, { method: "POST" });
      if (res.ok) {
        setDevices([]);
      }
    } catch (err) {
      console.error("Error clearing devices:", err);
    } finally {
      setClearing(false);
    }
  };

  const getBytes = (d: LiveDevice) => d.total_bytes ?? d.totalBytes ?? 0;
  const getPackets = (d: LiveDevice) => d.total_packets ?? d.totalPackets ?? 0;
  const getLastSeen = (d: LiveDevice) => d.last_seen || d.lastSeen || "";

  const displayed = devices.filter(d => {
    const matchesFilter = filter === "ALL" || d.status === filter;
    const matchesSearch = !search || d.ip.toLowerCase().includes(search.toLowerCase()) ||
      (d.hostname && d.hostname.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const activeCount = devices.filter(d => d.status === "active").length;
  const suspiciousDevices = devices.filter(d => d.status === "suspicious");
  const inactiveCount = devices.filter(d => d.status === "inactive").length;
  const totalTraffic = devices.reduce((sum, d) => sum + getBytes(d), 0);

  return (
    <>
      <Topbar title="Devices" subtitle="Live network host inventory" />
      <div className="page-content fade-in-up">

        {/* Page Header */}
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div className="page-header-left">
            <h1 className="page-header-title">Device Inventory</h1>
            <p className="page-header-subtitle">
              {devices.length === 0
                ? "Discovered network hosts from live packet capture"
                : `${devices.length} live host${devices.length === 1 ? "" : "s"} actively observed on the network`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn btn-ghost"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}
              onClick={fetchDevices}
              title="Refresh device list"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              Refresh
            </button>
            <button
              className="btn btn-danger"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}
              onClick={handleClearDevices}
              disabled={clearing || devices.length === 0}
              title="Clear all device records"
            >
              <Trash2 size={14} />
              {clearing ? "Clearing..." : "Clear Devices"}
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="stats-strip">
          {[
            { label: "Total Devices",  value: devices.length, color: undefined },
            { label: "Active",         value: activeCount, color: "var(--color-success)" },
            { label: "Suspicious",     value: suspiciousDevices.length, color: "var(--color-danger, #ef4444)" },
            { label: "Inactive",       value: inactiveCount, color: "var(--color-text-muted)" },
            { label: "Total Traffic",  value: formatBytes(totalTraffic), color: undefined },
          ].map(s => (
            <div className="stats-strip-item" key={s.label}>
              <span className="stats-strip-label">{s.label}</span>
              <span className="stats-strip-value" style={s.color ? { color: s.color } : undefined}>{s.value}</span>
              <span className="stats-strip-sub" style={{ color: "var(--color-accent-emerald, #10b981)" }}>LIVE</span>
            </div>
          ))}
        </div>

        {/* Suspicious Alert Banner */}
        {suspiciousDevices.length > 0 && (
          <div style={{
            display: "flex", gap: 12, alignItems: "center",
            background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-lg)", padding: "12px 16px", marginBottom: 16,
          }}>
            <ShieldAlert size={18} color="#ef4444" />
            <div style={{ fontSize: "0.84rem", color: "#f87171" }}>
              <strong>{suspiciousDevices.length} suspicious host{suspiciousDevices.length > 1 ? "s" : ""} detected: </strong>
              {suspiciousDevices.map(d => d.ip).join(", ")}
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="card-title">Live Discovered Devices ({displayed.length})</span>
              <span className="live-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span className="live-dot" /> LIVE
              </span>
            </div>
            <input
              type="text"
              placeholder="Search IP or hostname..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ width: 220, fontSize: "0.8rem", padding: "5px 10px" }}
            />
          </div>

          <div className="filter-bar">
            {["ALL", "active", "suspicious", "inactive"].map(f => (
              <button
                key={f}
                className={`tab-btn${filter === f ? " active" : ""}`}
                style={{ flex: "initial", padding: "6px 14px" }}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {devices.length === 0 ? (
            <div style={{
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent-blue)",
              }}>
                <Radio size={26} />
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", fontWeight: 600 }}>
                  No Devices Discovered Yet
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)", maxWidth: 460 }}>
                  Devices are cataloged automatically as packets flow through the network capture engine.
                  Start capture on the Live Traffic page to discover active hosts.
                </p>
              </div>
              <Link to="/live" className="btn btn-primary" style={{ marginTop: 8 }}>
                Go to Live Traffic
              </Link>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              No devices match the selected filter.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Hostname</th>
                    <th>Total Traffic</th>
                    <th>Packets</th>
                    <th>Protocols</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(d => (
                    <tr
                      key={d.id || d.ip}
                      style={d.status === "suspicious" ? { background: "rgba(239, 68, 68, 0.05)" } : undefined}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className={`status-dot ${d.status}`} />
                          <span style={{
                            fontSize: "0.78rem",
                            textTransform: "capitalize",
                            color: d.status === "suspicious" ? "#ef4444" : undefined,
                            fontWeight: d.status === "suspicious" ? 600 : 400,
                          }}>
                            {d.status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="ip-text" style={{ fontWeight: 600 }}>{d.ip}</span>
                      </td>
                      <td style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {d.hostname || d.ip}
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.8rem" }}>
                        {formatBytes(getBytes(d))}
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: "0.8rem" }}>
                        {getPackets(d).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(d.protocols || []).length > 0 ? (
                            d.protocols.map(p => (
                              <span key={p} className="chip chip-blue">{p}</span>
                            ))
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                        {getLastSeen(d) ? new Date(getLastSeen(d)).toLocaleTimeString() : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
