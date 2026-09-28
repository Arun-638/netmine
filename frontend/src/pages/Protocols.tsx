import Topbar from "../components/layout/Topbar";
import ProtocolChart from "../charts/ProtocolChart";
import { mockProtocols } from "../mock/data";

function formatBytes(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${bytes} B`;
}

export default function Protocols() {
  return (
    <>
      <Topbar title="Protocol Analytics" subtitle="Network protocol distribution and statistics" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Protocol Analytics</h1>
            <p className="page-header-subtitle">Breakdown of observed network protocols</p>
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Protocol Distribution</span>
              <span className="demo-badge">Demo Data</span>
            </div>
            <div className="chart-wrapper-lg"><ProtocolChart data={mockProtocols}/></div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Protocol Statistics</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Protocol</th><th>Packets</th><th>Bytes</th><th>Share</th></tr>
              </thead>
              <tbody>
                {mockProtocols.map(p => (
                  <tr key={p.protocol}>
                    <td style={{fontWeight:600,color:"var(--color-text-primary)"}}>{p.protocol}</td>
                    <td>{p.packets.toLocaleString()}</td>
                    <td>{formatBytes(p.bytes)}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:80,height:4,borderRadius:2,background:"var(--color-bg-hover)"}}>
                          <div style={{width:`${p.percentage}%`,height:"100%",borderRadius:2,background:"var(--color-accent-primary)"}}/>
                        </div>
                        <span>{p.percentage}%</span>
                      </div>
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
