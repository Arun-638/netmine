// =========================================================
// NetMine AI — App Layout
// Wraps all pages with Sidebar + Topbar + Collapsible State
// =========================================================
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

function AppLayoutInner() {
  const { isCollapsed } = useSidebar();

  return (
    <div className={`app-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutInner />
    </SidebarProvider>
  );
}
