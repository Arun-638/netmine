import Topbar from "../components/layout/Topbar";
import { mockClusters, mockAssociationRules } from "../mock/data";

export default function KnowledgeDiscovery() {
  return (
    <>
      <Topbar title="Knowledge Discovery" subtitle="DBSCAN clusters and association rules" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Knowledge Discovery</h1>
            <p className="page-header-subtitle">
              Data Mining results: DBSCAN clustering · Association Rule Mining
            </p>
          </div>
          <div className="page-header-actions">
            <span className="not-implemented-badge" style={{display:"inline-flex",alignItems:"center",padding:"4px 12px",borderRadius:20,fontSize:"0.72rem",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",color:"var(--color-accent-purple)"}}>
              NOT YET EVALUATED
            </span>
          </div>
        </div>

        {/* DBSCAN Clusters */}
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header">
            <span className="card-title">DBSCAN Cluster Summary</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:12}}>
            {mockClusters.map(c => (
              <div key={c.id} style={{
                background:"var(--color-bg-elevated)",border:`1px solid ${c.color}30`,
                borderLeft:`3px solid ${c.color}`,borderRadius:"var(--radius-md)",padding:14
              }}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontWeight:600,fontSize:"0.82rem",color:"var(--color-text-primary)"}}>{c.label}</span>
                  <span style={{
                    fontSize:"0.68rem",fontWeight:600,padding:"2px 6px",borderRadius:10,
                    background:`${c.color}20`,color:c.color,border:`1px solid ${c.color}40`
                  }}>
                    {c.id === -1 ? "Noise" : `Cluster ${c.id}`}
                  </span>
                </div>
                <p style={{fontSize:"0.75rem",color:"var(--color-text-muted)",marginBottom:8,lineHeight:1.4}}>
                  {c.description}
                </p>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.72rem",color:"var(--color-text-secondary)"}}>
                  <span>Flows: <strong style={{color:"var(--color-text-primary)"}}>{c.size.toLocaleString()}</strong></span>
                  <span>Avg pkts: <strong style={{color:"var(--color-text-primary)"}}>{c.avgPackets}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <div className="not-implemented" style={{paddingTop:16,paddingBottom:8}}>
            <span style={{fontSize:"0.8rem",color:"var(--color-text-muted)"}}>
              Actual DBSCAN results will replace this after Phase 7 (Data Mining pipeline).
            </span>
          </div>
        </div>

        {/* Association Rules */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Association Rules (Apriori)</span>
            <span className="demo-badge">Demo Data</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Antecedent</th><th>Consequent</th>
                  <th>Support</th><th>Confidence</th><th>Lift</th>
                </tr>
              </thead>
              <tbody>
                {mockAssociationRules.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {r.antecedent.map(a => (
                          <span key={a} style={{
                            background:"rgba(6,182,212,0.1)",color:"var(--color-accent-secondary)",
                            padding:"1px 7px",borderRadius:10,fontSize:"0.72rem",fontFamily:'"JetBrains Mono",monospace'
                          }}>{a}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {r.consequent.map(c => (
                          <span key={c} style={{
                            background:"rgba(139,92,246,0.1)",color:"var(--color-accent-purple)",
                            padding:"1px 7px",borderRadius:10,fontSize:"0.72rem",fontFamily:'"JetBrains Mono",monospace'
                          }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{fontFamily:'"JetBrains Mono",monospace'}}>{(r.support*100).toFixed(1)}%</td>
                    <td style={{fontFamily:'"JetBrains Mono",monospace',color:r.confidence>0.9?"var(--color-success)":"var(--color-text-secondary)"}}>
                      {(r.confidence*100).toFixed(1)}%
                    </td>
                    <td style={{fontFamily:'"JetBrains Mono",monospace',color:r.lift>10?"var(--color-danger)":r.lift>5?"var(--color-warning)":"var(--color-text-secondary)",fontWeight:600}}>
                      {r.lift.toFixed(1)}x
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
