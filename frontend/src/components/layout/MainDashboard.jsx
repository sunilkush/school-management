import React, { useEffect, useState, lazy, Suspense } from "react";
import { Layout, Drawer, Spin } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";

const Sidebar = lazy(() => import("../sidebar/Sidebar"));
const Topbar = lazy(() => import("../navbar/Topbar"));

const { Header, Content } = Layout;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);

  const role = user?.role?.name;

  // ✅ Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // ✅ Redirect (optional)
  useEffect(() => {
    if (role !== "Super Admin" && !activeYear?._id) {
      // navigate("/no-active-year");
    }
  }, [role, activeYear, navigate]);

  // ✅ Resize Handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;

      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // cleaner
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Toggle
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ================= DESKTOP SIDEBAR ================= */}
      {!isMobile && (
        <Suspense fallback={<Spin fullscreen />}>
          <Sidebar isOpen={isSidebarOpen} />
        </Suspense>
      )}

      {/* ================= MOBILE SIDEBAR ================= */}
      <Drawer
        placement="left"
        closable={false}
        open={isMobile && isSidebarOpen}
        onClose={toggleSidebar}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        <Suspense fallback={<Spin />}>
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
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 999,
          }}
        >
          <Suspense fallback={<Spin />}>
            <Topbar
              toggleSidebar={toggleSidebar}
              isOpen={isSidebarOpen}
            />
          </Suspense>
        </Header>

        {/* CONTENT */}
        <Content
          style={{
            padding: 16,
            background: "#f0f2f5",
            minHeight: "calc(100vh - 64px)",
            overflow: "auto",
          }}
        >
          {/* 🔥 Outlet bhi lazy routes ke liye wrap karo */}
          <Suspense fallback={<Spin />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;