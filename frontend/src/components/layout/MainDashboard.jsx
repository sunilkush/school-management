import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { Layout, Drawer, Skeleton } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import Loader from "../Loader/Loader";
import BottomNav from "../mobile/BottomNav";

const Sidebar = lazy(() => import("../sidebar/Sidebar"));
const Topbar  = lazy(() => import("../navbar/Topbar"));

const { Content } = Layout;

const SIDEBAR_EXPANDED  = 240;
const SIDEBAR_COLLAPSED = 68;

const getWindowWidth = () =>
  typeof window !== "undefined" ? window.innerWidth : 1280;

/* ── Skeleton fallbacks ─────────────────────────────────────────── */
const SidebarFallback = ({ collapsed }) => (
  <div style={{
    width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
    height: "100vh",
    background: "var(--surface)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "20px 10px",
    flexShrink: 0,
    transition: "width 0.25s ease",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
      <Skeleton.Avatar active size={38} shape="square" style={{ borderRadius: 10, flexShrink: 0 }} />
      {!collapsed && <Skeleton.Input active size="small" style={{ width: 130, borderRadius: 6 }} />}
    </div>
    {[1, 0.9, 0.95, 0.85, 0.9, 0.88, 0.82].map((op, i) => (
      <Skeleton.Button key={i} active block style={{
        height: 38, borderRadius: 9, opacity: op,
        width: collapsed ? 44 : "100%",
      }} />
    ))}
  </div>
);

const TopbarFallback = () => (
  <div style={{
    height: 60,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 14,
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
  }}>
    <Skeleton.Button active size="small" style={{ width: 32, borderRadius: 8 }} />
    <Skeleton.Input active size="small" style={{ width: 200, borderRadius: 10 }} />
    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
      <Skeleton.Button active size="small" shape="circle" />
      <Skeleton.Button active size="small" shape="circle" />
      <Skeleton.Avatar active size={32} />
    </div>
  </div>
);

/* ── Dashboard ──────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthInitialized, isLoggingOut } = useSelector((s) => s.auth);
  const { activeYear }  = useSelector((s) => s.academicYear);

  const role = user?.role?.name;
  const resizeRef = useRef(null);

  const [isMobile,         setIsMobile]         = useState(() => getWindowWidth() < 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getWindowWidth() < 1280);
  const [drawerOpen,       setDrawerOpen]       = useState(false);

  useEffect(() => {
    const handle = () => {
      clearTimeout(resizeRef.current);
      resizeRef.current = setTimeout(() => {
        const w = getWindowWidth();
        const mobile = w < 1024;
        setIsMobile(mobile);
        if (!mobile) {
          setSidebarCollapsed(w < 1280);
          setDrawerOpen(false);
        }
      }, 120);
    };
    window.addEventListener("resize", handle);
    return () => { window.removeEventListener("resize", handle); clearTimeout(resizeRef.current); };
  }, []);

  const toggleSidebar = () => {
    if (isMobile) setDrawerOpen((p) => !p);
    else setSidebarCollapsed((p) => !p);
  };

  const sidebarW  = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const mainShift = isMobile ? 0 : sidebarW;

  if (!isAuthInitialized || isLoggingOut) return <Loader />;

  return (
    <>
      <style>{`
        .dash-main {
          transition: margin-left 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .dash-drawer .ant-drawer-body {
          padding: 0 !important;
          overflow: hidden !important;
        }
        .dash-drawer .ant-drawer-content-wrapper {
          box-shadow: 4px 0 32px rgba(0,0,0,0.15) !important;
        }
        .dash-outlet {
          animation: outletFadeIn 0.22s ease forwards;
        }
        @keyframes outletFadeIn {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "var(--surface-page)" }}>

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <div style={{
            width: sidebarW,
            flexShrink: 0,
            transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
            position: "relative",
            zIndex: 100,
          }}>
            <Suspense fallback={<SidebarFallback collapsed={sidebarCollapsed} />}>
              <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            </Suspense>
          </div>
        )}

        {/* ── MOBILE DRAWER SIDEBAR ── */}
        {isMobile && (
          <Drawer
            className="dash-drawer"
            placement="left"
            closable={false}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width={SIDEBAR_EXPANDED}
            styles={{ body: { padding: 0, overflow: "hidden" } }}
          >
            <Suspense fallback={<SidebarFallback collapsed={false} />}>
              <Sidebar collapsed={false} onToggle={() => setDrawerOpen(false)} />
            </Suspense>
          </Drawer>
        )}

        {/* ── MAIN CONTENT AREA ── */}
        <div className="dash-main" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh",
        }}>

          {/* TOPBAR */}
          <div style={{
            height: 60,
            position: "sticky",
            top: 0,
            zIndex: 99,
            flexShrink: 0,
          }}>
            <Suspense fallback={<TopbarFallback />}>
              <Topbar
                toggleSidebar={toggleSidebar}
                sidebarCollapsed={sidebarCollapsed}
                isMobile={isMobile}
              />
            </Suspense>
          </div>

          {/* PAGE */}
          <div style={{
            flex: 1,
            overflow: "auto",
            background: "var(--surface-page)",
            /* On mobile, add padding at bottom for the fixed BottomNav */
            paddingBottom: isMobile ? "calc(60px + env(safe-area-inset-bottom))" : 0,
          }}>
            <div className="dash-outlet">
              <Suspense fallback={
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                  <Skeleton.Input active style={{ width: 220, height: 26, borderRadius: 8 }} />
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[1,2,3,4].map((i) => (
                      <Skeleton.Button key={i} active style={{ minWidth: 130, height: 88, borderRadius: 12, flex: "1 1 130px" }} />
                    ))}
                  </div>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </div>
              }>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <BottomNav onMenuOpen={() => setDrawerOpen(true)} />
      )}
    </>
  );
};

export default Dashboard;
