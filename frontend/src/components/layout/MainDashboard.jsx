import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { Layout, Drawer, Spin } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
const Sidebar = lazy(() => import("../sidebar/Sidebar"));
const Topbar = lazy(() => import("../navbar/Topbar"));

const { Header, Content } = Layout;

// ✅ Safe window width check (SSR-safe)
const getWindowWidth = () =>
  typeof window !== "undefined" ? window.innerWidth : 1024;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);

  const role = user?.role?.name;

  // ✅ SSR-safe initial states
  const [isMobile, setIsMobile] = useState(() => getWindowWidth() < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => getWindowWidth() >= 1024
  );
   const { isDark: isDarkMode } = useTheme();
  const resizeTimerRef = useRef(null);

  // ✅ Redirect if no active year (non-Super Admin)
  useEffect(() => {
    if (role !== "Super Admin" && !activeYear?._id) {
      // navigate("/no-active-year");
    }
  }, [role, activeYear, navigate]);

  // ✅ Debounced resize handler
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
 
  // ✅ Toggle sidebar open/close
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ================= DESKTOP SIDEBAR ================= */}
      {!isMobile && (
        <Suspense fallback={<Spin style={{ display: "block", margin: "20px auto" }} />}>
          <Sidebar isOpen={isSidebarOpen} />
        </Suspense>
      )}

      {/* ================= MOBILE SIDEBAR (Drawer) ================= */}
      <Drawer
        placement="left"
        closable={false}
        open={isMobile && isSidebarOpen}
        onClose={toggleSidebar}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        <Suspense fallback={<Spin style={{ display: "block", margin: "20px auto" }} />}>
          <Sidebar isOpen />
        </Suspense>
      </Drawer>

      {/* ================= MAIN LAYOUT ================= */}
      <Layout
        style={{
          marginLeft: !isMobile && isSidebarOpen ? 260 : 0,
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* HEADER */}
        <Header
          style={{
            padding: 0,
             background: isDarkMode ? "#141414" : "#fff",
            position: "sticky",
            top: 0,
            zIndex: 999,
          }}
        >
          <Suspense fallback={<Spin style={{ display: "block", margin: "20px auto" }} />}>
            <Topbar toggleSidebar={toggleSidebar} isOpen={isSidebarOpen} />
          </Suspense>
        </Header>

        {/* CONTENT */}
        <Content
          style={{
            padding: 16,
            background: "var(--surface-page)",
            color: "var(--text-primary)",
            minHeight: "calc(100vh - 64px)",
            overflow: "auto",
          }}
        >
          <Suspense fallback={<Spin style={{ display: "block", margin: "40px auto" }} />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;