import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { sidebarMenu } from "../../utils/sidebar";

function SidebarMenu({ role }) {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation(); // ✅ get current path

  const toggleMenu = (title) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const menuItems = sidebarMenu[role] || [];

  // Helper: check if parent should be active
  const isParentActive = (item) => {
    if (!item.subMenu) return false;
    return item.subMenu.some((sub) => sub.path === location.pathname);
  };

  return (
    <aside className="w-72 h-screen bg-white border-r p-4 pb-28 overflow-auto">
      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const parentActive = isParentActive(item); // ✅ parent active check

          return (
            <div key={index}>
              {!item.subMenu ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-800 text-sm ${
                      isActive ? "bg-blue-100 font-semibold text-blue-800" : "text-gray-700"
                    }`
                  }
                >
                  {Icon && <Icon size={18} />}
                  <span>{item.title}</span>
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:bg-blue-100 hover:text-blue-600 ${
                      parentActive ? "bg-blue-100 font-semibold text-blue-800" : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon size={18} />}
                      <span>{item.title}</span>
                    </div>
                    {openMenus[item.title] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {(openMenus[item.title] || parentActive) && (
                    <ul className="ml-8 mt-1 text-sm space-y-1">
                      {item.subMenu.map((sub, subIndex) => {
                        const SubIcon = sub.icon;
                        return (
                          <li key={subIndex}>
                            <NavLink
                              to={sub.path}
                              className={({ isActive }) =>
                                `flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600 ${
                                  isActive ? "font-medium text-blue-600" : "text-gray-700"
                                }`
                              }
                            >
                              {SubIcon && <SubIcon size={16} />}
                              <span>{sub.title}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default SidebarMenu;
