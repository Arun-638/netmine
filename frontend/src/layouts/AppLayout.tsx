// =========================================================
// NetMine AI — App Layout
// Wraps all pages with Sidebar + Topbar
// =========================================================
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
