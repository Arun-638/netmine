import Topbar from "../components/layout/Topbar";
import { mockAnomalies } from "../mock/data";
import { AlertTriangle } from "lucide-react";

function severityClass(s: string) {
  const m: Record<string,string> = { critical:"badge badge-critical", high:"badge badge-high", medium:"badge badge-medium", low:"badge badge-low" };
  return m[s] ?? "badge";
}
function statusClass(s: string) {
  const m: Record<string,string> = { active:"badge badge-active", resolved:"badge badge-resolved", investigating:"badge badge-investigating" };
  return m[s] ?? "badge";
}

export default function Anomalies() {
  const active = mockAnomalies.filter(a => a.status === "active").length;
  const critical = mockAnomalies.filter(a => a.severity === "critical").length;

  return (
    <>
      <Topbar title="Anomalies" subtitle="Detected network anomalies and behavioral deviations" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Anomaly Detection</h1>
            <p className="page-header-subtitle">
              Isolation Forest + DBSCAN results — <span style={{color:"var(--color-accent-purple)"}}>NOT YET EVALUATED</span>
            </p>
          </div>
          <div className="page-header-actions">
            <div style={{display:"flex",gap:12}}>
              <div className="card" style={{padding:"10px 16px",display:"flex",gap:8,alignItems:"center"}}>
                <AlertTriangle size={14} color="var(--color-danger)"/>
                <span style={{fontSize:"0.8rem"}}>{active} active</span>
              </div>
              <div className="card" style={{padding:"10px 16px",display:"flex",gap:8,alignItems:"center"}}>
                <AlertTriangle size={14} color="var(--color-warning)"/>
                <span style={{fontSize:"0.8rem"}}>{critical} critical</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">All Anomalies</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th><th>Type</th><th>Source IP</th>
                  <th>Dest IP</th><th>Severity</th><th>Score</th>
                  <th>Description</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockAnomalies.map(a => (
                  <tr key={a.id}>
                    <td style={{fontFamily:'"JetBrains Mono",monospace',fontSize:"0.75rem",whiteSpace:"nowrap"}}>
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td style={{color:"var(--color-text-primary)",fontWeight:500,whiteSpace:"nowrap"}}>{a.type}</td>
                    <td><span className="ip-text">{a.srcIp}</span></td>
                    <td><span className="ip-text">{a.dstIp}</span></td>
                    <td><span className={severityClass(a.severity)}>{a.severity}</span></td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{
                          width:48,height:4,borderRadius:2,
                          background:"var(--color-bg-hover)",overflow:"hidden"
                        }}>
                          <div style={{
                            width:`${a.score*100}%`,height:"100%",
                            background:a.score>0.85?"var(--color-danger)":a.score>0.65?"var(--color-warning)":"var(--color-success)"
                          }}/>
                        </div>
                        <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:"0.78rem"}}>
                          {(a.score*100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{maxWidth:280,fontSize:"0.8rem"}}>{a.description}</td>
                    <td><span className={statusClass(a.status)}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{marginTop:20}}>
          <div className="not-implemented">
            <span className="not-implemented-badge">Not Yet Evaluated</span>
            <p style={{fontSize:"0.9rem",fontWeight:600}}>Isolation Forest Model</p>
            <p style={{fontSize:"0.82rem",color:"var(--color-text-muted)",maxWidth:480}}>
              Isolation Forest and DBSCAN anomaly detection will be available after Phase 6–7 (ML + Data Mining).
              Scores above are demo values only.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
