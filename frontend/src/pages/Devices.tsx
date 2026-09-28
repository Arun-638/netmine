import Topbar from "../components/layout/Topbar";
import { mockDevices } from "../mock/data";

function formatBytes(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${bytes} B`;
}

export default function Devices() {
  return (
    <>
      <Topbar title="Devices" subtitle="Network host inventory" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Device Inventory</h1>
            <p className="page-header-subtitle">{mockDevices.length} hosts discovered</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Devices</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th><th>IP Address</th><th>Hostname</th>
                  <th>Total Bytes</th><th>Total Packets</th>
                  <th>Protocols</th><th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {mockDevices.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span className={`status-dot ${d.status}`}/>
                        <span style={{fontSize:"0.78rem",textTransform:"capitalize"}}>{d.status}</span>
                      </div>
                    </td>
                    <td><span className="ip-text">{d.ip}</span></td>
                    <td style={{color:"var(--color-text-primary)",fontWeight:500}}>{d.hostname}</td>
                    <td>{formatBytes(d.totalBytes)}</td>
                    <td>{d.totalPackets.toLocaleString()}</td>
                    <td>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {d.protocols.map(p => (
                          <span key={p} style={{
                            background:"rgba(59,130,246,0.1)",color:"var(--color-accent-primary)",
                            padding:"1px 7px",borderRadius:10,fontSize:"0.7rem",fontWeight:500
                          }}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{fontSize:"0.78rem",color:"var(--color-text-muted)"}}>
                      {new Date(d.lastSeen).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
