import React from "react";
import { Breadcrumb, Input, Dropdown, Avatar, Badge } from "antd";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const Topbar = ({ onToggle }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const crumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .slice(0, 4)
    .map((chunk) => ({ title: chunk.replace(/[-_]/g, " ") }));

  return (
    <header className="sticky top-0 z-30 px-3 md:px-6 py-2.5 bg-[var(--surface-header)] backdrop-blur-xl border-b border-[var(--border-muted)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3 flex-1">
          <button onClick={onToggle} className="h-10 w-10 rounded-xl bg-[var(--surface-soft)] grid place-items-center">
            <Menu size={18} />
          </button>
          <div className="hidden md:block min-w-[260px] max-w-[520px] w-full">
            <Input prefix={<Search size={16} />} placeholder="Search students, fees, payroll..." size="large" />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={toggleTheme} className="h-10 w-10 rounded-xl bg-[var(--surface-soft)] grid place-items-center">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Dropdown menu={{ items: [{ key: "1", label: "No new notifications" }] }} trigger={["click"]}>
            <button className="h-10 w-10 rounded-xl bg-[var(--surface-soft)] grid place-items-center">
              <Badge dot>
                <Bell size={18} />
              </Badge>
            </button>
          </Dropdown>

          <Dropdown
            trigger={["click"]}
            menu={{ items: [{ key: "profile", label: "Profile" }, { key: "logout", label: "Logout" }] }}
          >
            <button className="flex items-center gap-2 rounded-xl pl-1 pr-3 py-1 bg-[var(--surface-soft)]">
              <Avatar size={32}>{user?.fullName?.[0] || "U"}</Avatar>
              <span className="hidden md:inline text-sm font-medium text-[var(--text-primary)]">{user?.fullName || "User"}</span>
            </button>
          </Dropdown>
        </div>
      </div>

      <Breadcrumb className="mt-2 capitalize" items={[{ title: "dashboard" }, ...crumbs]} />
    </header>
  );
};

export default Topbar;
