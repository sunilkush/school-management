import React, { useEffect, useState } from "react";
import { Layout, Drawer } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";

import Sidebar from "../sidebar/Sidebar";
import Topbar from "../navbar/Topbar";

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

  // ✅ Resize Handler (optimized)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;

      setIsMobile(mobile);

      // 👉 Desktop = open | Mobile = closed
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
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
      {!isMobile && <Sidebar isOpen={isSidebarOpen} />}

      {/* ================= MOBILE SIDEBAR ================= */}
      <Drawer
        placement="left"
        closable={false}
        open={isMobile && isSidebarOpen}
        onClose={toggleSidebar}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        <Sidebar isOpen />
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
          <Topbar
            toggleSidebar={toggleSidebar}
            isOpen={isSidebarOpen} // ✅ FIXED PROP NAME
          />
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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;