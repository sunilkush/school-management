import React, { Suspense, lazy, useMemo, useState } from "react";
import { Layout, Drawer, Grid } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const Sidebar = lazy(() => import("../sidebar/Sidebar"));
const Topbar = lazy(() => import("../navbar/Topbar"));

const { Content } = Layout;
const { useBreakpoint } = Grid;

const MainDashboard = () => {
  const screens = useBreakpoint();
  const location = useLocation();
  const isMobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = useMemo(() => (collapsed ? 94 : 280), [collapsed]);

  const onToggle = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed((v) => !v);
  };

  return (
    <Layout className="min-h-screen bg-[var(--bg)]">
      {!isMobile && <Sidebar collapsed={collapsed} width={sidebarWidth} onToggle={onToggle} />}

      {isMobile && (
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={280}
          styles={{
            body: { padding: 0, background: "var(--dark-surface)" },
            header: { display: "none" },
          }}
        >
          <Sidebar collapsed={false} width={280} onToggle={() => setMobileOpen(false)} isMobile />
        </Drawer>
      )}

      <Layout
        className="transition-all duration-300"
        style={{ marginInlineStart: isMobile ? 0 : sidebarWidth }}
      >
        <Topbar onToggle={onToggle} isMobile={isMobile} />

        <Content className="p-3 md:p-5 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<div className="h-80 rounded-3xl bg-[var(--surface)] animate-pulse" />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainDashboard;
