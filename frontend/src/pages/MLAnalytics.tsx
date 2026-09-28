import Topbar from "../components/layout/Topbar";
import { mockMLMetrics } from "../mock/data";
import { FlaskConical } from "lucide-react";

export default function MLAnalytics() {
  return (
    <>
      <Topbar title="ML Analytics" subtitle="Supervised classification pipeline" />
      <div className="page-content fade-in-up">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">Machine Learning Analytics</h1>
            <p className="page-header-subtitle">
              Decision Tree · Random Forest · XGBoost — CICIDS2017 training — <span style={{color:"var(--color-accent-purple)"}}>NOT YET EVALUATED</span>
            </p>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
          {mockMLMetrics.map(m => (
            <div className="card" key={m.model}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <h3 style={{fontWeight:700,fontSize:"1rem",marginBottom:4}}>{m.model}</h3>
                  <span className="not-implemented-badge" style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:"0.68rem",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",color:"var(--color-accent-purple)"}}>
                    {m.status.replace("_"," ").toUpperCase()}
                  </span>
                </div>
                <FlaskConical size={20} color="var(--color-text-muted)"/>
              </div>
              {[
                {label:"Accuracy",   value:m.accuracy},
                {label:"Precision",  value:m.precision},
                {label:"Recall",     value:m.recall},
                {label:"F1 Score",   value:m.f1Score},
              ].map(metric => (
                <div key={metric.label} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:"0.78rem",color:"var(--color-text-muted)"}}>{metric.label}</span>
                    <span style={{fontSize:"0.78rem",fontFamily:'"JetBrains Mono",monospace',color:"var(--color-text-muted)"}}>
                      {metric.value === 0 ? "—" : `${(metric.value*100).toFixed(1)}%`}
                    </span>
                  </div>
                  <div style={{height:3,borderRadius:2,background:"var(--color-bg-hover)"}}>
                    <div style={{width:`${metric.value*100}%`,height:"100%",borderRadius:2,background:"var(--color-accent-primary)"}}/>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="not-implemented">
            <span className="not-implemented-badge">Phase 6 — Not Yet Implemented</span>
            <p style={{fontSize:"0.9rem",fontWeight:600}}>ML Training Pipeline</p>
            <p style={{fontSize:"0.82rem",color:"var(--color-text-muted)",maxWidth:520,textAlign:"center"}}>
              The ML pipeline (CICIDS2017 preprocessing → feature engineering → training → evaluation) 
              will be implemented in Phase 6. All metrics shown above are placeholders and will be 
              replaced with real experimental results. No metrics have been fabricated.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
