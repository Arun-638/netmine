import Topbar from "../components/layout/Topbar";
import { Settings as SettingsIcon } from "lucide-react";
export default function Settings() {
  return (
    <>
      <Topbar title="Settings" subtitle="System configuration" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Settings</h1>
            <p className="page-header-subtitle">Configure capture interfaces, thresholds and API endpoints</p>
          </div>
        </div>
        <div className="card">
          <div className="not-implemented">
            <SettingsIcon size={40} color="var(--color-text-muted)"/>
            <span className="not-implemented-badge">Not Yet Implemented</span>
            <p style={{fontSize:"0.9rem",fontWeight:600}}>System Settings</p>
            <p style={{fontSize:"0.82rem",color:"var(--color-text-muted)"}}>
              Network interface selection, anomaly thresholds, and API configuration will be added in later phases.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
