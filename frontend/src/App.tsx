// =========================================================
// NetMine AI — Root Application Router
// Uses: React Router DOM v6
// =========================================================
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Topbar from "./components/layout/Topbar";
import { SettingsProvider } from "./context/SettingsContext";
import { ToastProvider } from "./context/ToastContext";
import PageLoadingSpinner from "./components/ui/PageLoadingSpinner";

// Lazy-loaded pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const LiveTraffic = React.lazy(() => import("./pages/LiveTraffic"));
const Anomalies = React.lazy(() => import("./pages/Anomalies"));
const Devices = React.lazy(() => import("./pages/Devices"));
const Protocols = React.lazy(() => import("./pages/Protocols"));
const KnowledgeDiscovery = React.lazy(() => import("./pages/KnowledgeDiscovery"));
const MLAnalytics = React.lazy(() => import("./pages/MLAnalytics"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Settings = React.lazy(() => import("./pages/Settings"));

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <BrowserRouter>
      <Routes>
        {/* All pages share the AppLayout (Sidebar + page slot) */}
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <>
                <Topbar title="Dashboard" subtitle="Live network overview & anomaly monitoring" />
                <div className="page-content">
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <Dashboard />
                  </Suspense>
                </div>
              </>
            }
          />
          <Route path="/live"      element={<Suspense fallback={<PageLoadingSpinner />}><LiveTraffic /></Suspense>}       />
          <Route path="/traffic"   element={<Suspense fallback={<PageLoadingSpinner />}><LiveTraffic /></Suspense>}       />
          <Route path="/anomalies" element={<Suspense fallback={<PageLoadingSpinner />}><Anomalies /></Suspense>}         />
          <Route path="/devices"   element={<Suspense fallback={<PageLoadingSpinner />}><Devices /></Suspense>}           />
          <Route path="/protocols" element={<Suspense fallback={<PageLoadingSpinner />}><Protocols /></Suspense>}         />
          <Route path="/knowledge" element={<Suspense fallback={<PageLoadingSpinner />}><KnowledgeDiscovery /></Suspense>}/>
          <Route path="/ml"        element={<Suspense fallback={<PageLoadingSpinner />}><MLAnalytics /></Suspense>}       />
          <Route path="/reports"   element={<Suspense fallback={<PageLoadingSpinner />}><Reports /></Suspense>}           />
          <Route path="/settings"  element={<Suspense fallback={<PageLoadingSpinner />}><Settings /></Suspense>}          />
        </Route>
      </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}
