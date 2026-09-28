import Topbar from "../components/layout/Topbar";
import { FileText } from "lucide-react";
export default function Reports() {
  return (
    <>
      <Topbar title="Reports" subtitle="Analytics reports and exports" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Reports</h1>
            <p className="page-header-subtitle">Generate and export analytics reports</p>
          </div>
        </div>
        <div className="card">
          <div className="not-implemented">
            <FileText size={40} color="var(--color-text-muted)"/>
            <span className="not-implemented-badge">Not Yet Implemented</span>
            <p style={{fontSize:"0.9rem",fontWeight:600}}>Report Generation</p>
            <p style={{fontSize:"0.82rem",color:"var(--color-text-muted)"}}>
              PDF/CSV report generation will be available in Phase 15.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
