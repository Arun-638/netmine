// =========================================================
// NetMine AI — Root Application Router
// Uses: React Router DOM v6
// =========================================================
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import LiveTraffic from "./pages/LiveTraffic";
import Anomalies from "./pages/Anomalies";
import Devices from "./pages/Devices";
import Protocols from "./pages/Protocols";
import KnowledgeDiscovery from "./pages/KnowledgeDiscovery";
import MLAnalytics from "./pages/MLAnalytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Topbar from "./components/layout/Topbar";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All pages share the AppLayout (Sidebar + page slot) */}
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <>
                <Topbar title="Dashboard" subtitle="Network overview — DEMO MODE" />
                <div className="page-content">
                  <Dashboard />
                </div>
              </>
            }
          />
          <Route path="/live"      element={<LiveTraffic />}       />
          <Route path="/anomalies" element={<Anomalies />}         />
          <Route path="/devices"   element={<Devices />}           />
          <Route path="/protocols" element={<Protocols />}         />
          <Route path="/knowledge" element={<KnowledgeDiscovery />}/>
          <Route path="/ml"        element={<MLAnalytics />}       />
          <Route path="/reports"   element={<Reports />}           />
          <Route path="/settings"  element={<Settings />}          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
