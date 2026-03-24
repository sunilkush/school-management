import React, { lazy, memo, Suspense, useEffect, useState } from "react";
import { Layout, Typography, Spin } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { Loader } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
const SidebarMenu = lazy(() => import("./SidebarMenu"));


const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ isOpen }) => {
  const token = localStorage.getItem("accessToken");
  const { user } = useSelector((state) => state.auth);
  const [isDarkMode, setIsDarkMode] = useState(false);
   const { isDark } = useTheme();
  const role = user?.role?.name?.toLowerCase();
  const schoolName = user?.school?.name || "Super Admin";
   useEffect(() => {
    const checkDarkMode = () => {
      const root = document.documentElement;
      const body = document.body;
      const savedTheme = localStorage.getItem("theme");

      const darkEnabled =
        savedTheme === "dark" ||
        root.classList.contains("dark") ||
        body.classList.contains("dark") ||
        root.getAttribute("data-theme") === "dark";

      setIsDarkMode(darkEnabled);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    window.addEventListener("storage", checkDarkMode);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", checkDarkMode);
    };
  }, []);

  // ✅ Loading / unauthenticated state
  if (!token) {
    return (
      <Sider
        width={260}
         theme={isDark ? "dark" : "light"}
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
          background: isDarkMode ? "#141414" : "#ffffff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
            Authenticating...
          </Text>
        </div>
      </Sider>
    );
  }

  return (
    <Sider
      width={260}
       theme={isDark ? "dark" : "light"}
      trigger={null}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        borderRight: "1px solid var(--border-color)",
        background: "var(--surface-sidebar)",
        zIndex: 1000,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontWeight: 600,
           color: isDarkMode ? "#ffffff" : "#1677ff",
          minHeight: 64,
        }}
      >
        <div
          style={{
             background: isDarkMode ? "#303030" : "#e6f4ff",
            padding: 8,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 32,
            minHeight: 32,
          }}
        >
          <HomeOutlined style={{ fontSize: 16 }} />
        </div>

        {isOpen && (
           <Text ellipsis style={{ fontSize: 14, color: isDarkMode ? "#ffffff" : "inherit" }}>
            {schoolName}
          </Text>
        )}
      </div>

      {/* Divider */}
     <div
        style={{
          borderBottom: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
          margin: "0 12px",
        }}
      />


      {/* MENU */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px 0",
        }}
      >
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: 20 }}>
              <Loader className="animate-spin" />
            </div>
          }
        >
          <SidebarMenu role={role}  />
        </Suspense>
      </div>
    </Sider>
  );
};

export default memo(Sidebar);