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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Redirect if no active academic year
  useEffect(() => {
    if (role !== "Super Admin" && !activeYear?._id) {
      // navigate("/no-active-year");
    }
  }, [role, activeYear, navigate]);

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar isOpen={isSidebarOpen} />}

      {/* Mobile Sidebar */}
      <Drawer
        title={user?.school?.name || "School"}
        placement="left"
        closable={false}
        open={isMobile && isSidebarOpen}
        onClose={toggleSidebar}
        width={260}
        bodyStyle={{ padding: 0 }}
      >
        <Sidebar isOpen />
      </Drawer>

      {/* Main Layout */}
      <Layout
        style={{
          marginLeft: !isMobile && isSidebarOpen ? 260 : 0,
          transition: "margin-left 0.2s ease",
        }}
      >
        {/* Header */}
        <Header style={{ padding: 0, background: "#fff" }}>
          <Topbar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </Header>

        {/* Page Content */}
        <Content
          style={{
            padding: 16,
            background: "#f0f2f5",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
