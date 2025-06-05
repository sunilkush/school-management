import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { sidebarMenu } from "../../utils/sidebar";

function SidebarMenu({ role }) {
  const [openMenus, setOpenMenus] = useState({});
  const toggleMenu = (title) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const menuItems = sidebarMenu[role] || [];

  return (
    
    <aside className="w-72 h-screen bg-white border-r p-4 pb-10 shadow-sm overflow-auto">
      <nav className="space-y-2">
        {menuItems.map((item, index) => (
           
          <div key={index}>
            {!item.subMenu ? (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                    isActive ? "bg-purple-100 font-semibold" : "text-gray-700"
                  }`
                }
              >
                {item.icon && <item.icon size={18} />}
                <span>{item.title}</span>
              </NavLink>
            ) : (
              <>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon size={18} />}
                    <span>{item.title}</span>
                  </div>
                  {openMenus[item.title] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {openMenus[item.title] && (
                  <ul className="ml-8 mt-1 text-sm space-y-1">
                    {item.subMenu.map((sub, subIndex) => (
                      <li key={subIndex}>
                        <NavLink
                          to={sub.path}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${
                              isActive ? "font-medium text-purple-600" : "text-gray-700"
                            }`
                          }
                        >
                          {sub.icon && <sub.icon size={16} />}
                          <span>{sub.title}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default SidebarMenu;
