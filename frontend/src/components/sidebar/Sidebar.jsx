import React from "react";
import { Layout, Avatar, Typography } from "antd";
import { School, ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import SidebarMenu from "./SidebarMenu";
import { motion } from "framer-motion";

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ collapsed, width, onToggle, isMobile = false }) => {
  const { user } = useSelector((state) => state.auth);
  const schoolName = user?.school?.name || "School ERP";

  return (
    <Sider
      width={width}
      collapsedWidth={94}
      collapsed={collapsed}
      trigger={null}
      style={{
        position: isMobile ? "relative" : "fixed",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        overflow: "hidden",
        background: "linear-gradient(180deg, #020817 0%, #0f172a 100%)",
        borderInlineEnd: "1px solid rgba(148, 163, 184, 0.18)",
      }}
    >
      <div className="h-full flex flex-col text-slate-100">
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar size={36} style={{ background: "#2563eb" }} icon={<School size={18} />} />
            {!collapsed && <Text className="!text-slate-100 !font-semibold truncate">{schoolName}</Text>}
          </div>

          {!isMobile && (
            <button onClick={onToggle} className="h-8 w-8 rounded-lg bg-slate-800/70 grid place-items-center">
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto py-3">
          <SidebarMenu isOpen={!collapsed} />
        </motion.div>
      </div>
    </Sider>
  );
};

export default Sidebar;
