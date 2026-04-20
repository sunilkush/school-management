import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { Layout, Drawer, Skeleton } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const Sidebar = lazy(() => import("../sidebar/Sidebar"));
const Topbar = lazy(() => import("../navbar/Topbar"));

const { Header, Content } = Layout;

/* ─────────────────────────────────────────
   SSR-safe window width
───────────────────────────────────────── */
const getWindowWidth = () =>
  typeof window !== "undefined" ? window.innerWidth : 1024;

/* ─────────────────────────────────────────
   Design tokens
───────────────────────────────────────── */
const tokens = () => ({
  layoutBg: "var(--color-page-bg)",
  headerBg: "var(--color-bg)",
  headerBorder: "var(--color-border)",
  contentBg: "var(--color-page-bg)",
  drawerBg: "var(--color-sidebar-bg)",
  sidebarWidth: 260,
});

/* ─────────────────────────────────────────
   Skeleton fallbacks
───────────────────────────────────────── */
const SidebarFallback = ({ isDark }) => (
  <div
    style={{
      width: 260,
      height: "100vh",
      background: isDark ? "#0d0d0d" : "#ffffff",
      borderRight: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`,
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      flexShrink: 0,
    }}
  >
    {/* Header shimmer */}
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <Skeleton.Avatar active size={36} />
      <Skeleton.Input active size="small" style={{ width: 140, borderRadius: 6 }} />
    </div>
    <div style={{ borderBottom: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`, margin: "4px 0 8px" }} />
    {/* Menu item shimmers */}
    {[1, 0.9, 0.95, 0.85, 0.9].map((op, i) => (
      <Skeleton.Input
        key={i}
        active
        size="small"
        style={{ width: `${op * 100}%`, height: 36, borderRadius: 8, opacity: op }}
      />
    ))}
  </div>
);

const TopbarFallback = ({ isDark }) => (
  <div
    style={{
      height: 64,
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: 16,
      background: isDark ? "#0d0d0d" : "#ffffff",
    }}
  >
    <Skeleton.Button active size="small" style={{ width: 28, borderRadius: 6 }} />
    <Skeleton.Input active size="small" style={{ width: 180, borderRadius: 8 }} />
    <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
      <Skeleton.Button active size="small" shape="circle" />
      <Skeleton.Button active size="small" shape="circle" />
      <Skeleton.Avatar active size={32} />
    </div>
  </div>
);

// eslint-disable-next-line no-unused-vars
const ContentFallback = ({ isDark }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
    <Skeleton.Input active style={{ width: 240, height: 28, borderRadius: 8 }} />
    <div style={{ display: "flex", gap: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton.Button
          key={i}
          active
          style={{ width: 160, height: 90, borderRadius: 12, flex: 1 }}
        />
      ))}
    </div>
    <Skeleton active paragraph={{ rows: 5 }} />
  </div>
);

/* ─────────────────────────────────────────
   Dashboard
───────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);
  const { isDark: isDarkMode } = useTheme();
  const t = tokens();

  const role = user?.role?.name;
  const resizeTimerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => getWindowWidth() < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => getWindowWidth() >= 1024);

  /* Redirect non-Super-Admin without active year */
  useEffect(() => {
    if (role !== "Super Admin" && !activeYear?._id) {
      // navigate("/no-active-year");
    }
  }, [role, activeYear, navigate]);

  /* Debounced resize handler */
  useEffect(() => {
    const handleResize = () => {
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const mobile = getWindowWidth() < 1024;
        setIsMobile(mobile);
        setIsSidebarOpen(!mobile);
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimerRef.current);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const sidebarVisible = !isMobile && isSidebarOpen;

  return (
    <>
      {/* ── Global layout styles ── */}
      <style>{`
        /* Smooth sidebar-driven margin shift */
        .dashboard-main {
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Mobile drawer: remove default body padding */
        .sidebar-drawer .ant-drawer-body {
          padding: 0 !important;
          overflow: hidden !important;
        }
        .sidebar-drawer .ant-drawer-content {
          background: ${t.drawerBg} !important;
        }

        /* Content area scroll */
        .dashboard-content {
          overflow-x: hidden;
          overflow-y: auto;
        }

        /* Subtle page-load fade-in for content */
        @keyframes contentFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dashboard-outlet {
          animation: contentFadeIn 0.25s ease forwards;
        }
      `}</style>

      <Layout style={{ minHeight: "100vh", background: t.layoutBg }}>

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <Suspense fallback={<SidebarFallback isDark={isDarkMode} />}>
            <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
          </Suspense>
        )}

        {/* ── MOBILE DRAWER SIDEBAR ── */}
        <Drawer
          className="sidebar-drawer"
          placement="left"
          closable={false}
          open={isMobile && isSidebarOpen}
          onClose={toggleSidebar}
          width={t.sidebarWidth}
          styles={{ body: { padding: 0, overflow: "hidden" } }}
        >
          <Suspense fallback={<SidebarFallback isDark={isDarkMode} />}>
            <Sidebar isOpen onToggle={toggleSidebar} />
          </Suspense>
        </Drawer>

        {/* ── MAIN AREA ── */}
        <Layout
          className="dashboard-main"
          style={{
            marginLeft: sidebarVisible ? t.sidebarWidth : 0,
            background: t.layoutBg,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* TOPBAR */}
          <Header
            style={{
              padding: 0,
              height: 64,
              lineHeight: "64px",
              background: t.headerBg,
              borderBottom: `1px solid ${t.headerBorder}`,
              position: "sticky",
              top: 0,
              zIndex: 999,
              flexShrink: 0,
              boxShadow: isDarkMode
                ? "0 1px 0 #1f1f1f"
                : "0 1px 0 #f0f0f0",
            }}
          >
            <Suspense fallback={<TopbarFallback isDark={isDarkMode} />}>
              <Topbar toggleSidebar={toggleSidebar} isOpen={isSidebarOpen} />
            </Suspense>
          </Header>

          {/* PAGE CONTENT */}
          <Content
            className="dashboard-content"
            style={{
              flex: 1,
              padding: isMobile ? 12 : 20,
              background: t.contentBg,
              color: "var(--color-text)",
              minHeight: "calc(100vh - 64px)",
            }}
          >
            <div className="dashboard-outlet">
              <Suspense fallback={<ContentFallback isDark={isDarkMode} />}>
                <Outlet />
              </Suspense>
            </div>
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default Dashboard;
