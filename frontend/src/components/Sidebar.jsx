import { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const MenuItem = ({ icon, title, name, children }) => (
    <div>
      <button
        onClick={() => toggleMenu(name)}
        className="flex justify-between items-center w-full px-4 py-2 hover:bg-gray-800 text-left"
      >
        <span>{icon} {title}</span>
        {children && <span>{openMenu === name ? "−" : "+"}</span>}
      </button>
      {children && openMenu === name && (
        <div className="pl-6 text-sm space-y-1">{children}</div>
      )}
    </div>
  );

  return (
    <aside className="w-72 min-h-screen bg-gray-900 text-white py-4 overflow-y-auto border-r border-white">
      <h2 className="text-xl font-bold px-4 mb-4">📋 Super Admin Panel</h2>

      <nav className="space-y-1">
      
         <Link to={'dashboard'} className="block hover:bg-gray-800 px-4 py-2">📊 Dashboard</Link>
       

        <MenuItem icon="🏫" title="Schools" name="schools">
          <Link to={'manage-schools'} className="block hover:bg-gray-800 px-4 py-1">Manage Schools</Link>
          <Link to={'add-edit-schools'} className="block hover:bg-gray-800 px-4 py-1">Add/Edit/Delete Schools</Link>
          <a className="block hover:bg-gray-800 px-4 py-1">View School Admins</a>
        </MenuItem>

        <MenuItem icon="👨‍💼" title="Admins" name="admins">
          <a className="block hover:bg-gray-800 px-4 py-1">View & Manage School Admins</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Assign Schools</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Activate/Deactivate</a>
        </MenuItem>

        <MenuItem icon="👥" title="Users" name="users">
          <a className="block hover:bg-gray-800 px-4 py-1">View All Users</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Roles & Permissions</a>
        </MenuItem>

        <MenuItem icon="🛡️" title="Roles & Permissions" name="roles">
          <a className="block hover:bg-gray-800 px-4 py-1">Role Management</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Assign Module Access (CRUD)</a>
        </MenuItem>

        <MenuItem icon="📚" title="Modules Management" name="modules">
          <a className="block hover:bg-gray-800 px-4 py-1">Enable/Disable School Modules</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Module Settings</a>
        </MenuItem>

        <MenuItem icon="📝" title="Reports" name="reports">
          <a className="block hover:bg-gray-800 px-4 py-1">Student Report</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Fee Report</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Attendance Report</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Staff Report</a>
          <a className="block hover:bg-gray-800 px-4 py-1">System Usage</a>
        </MenuItem>

        <MenuItem icon="⚙️" title="System Settings" name="settings">
          <a className="block hover:bg-gray-800 px-4 py-1">Academic Years</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Global Settings</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Notification Settings</a>
        </MenuItem>

        <MenuItem icon="🔐" title="Authentication Logs" name="authLogs">
          <a className="block hover:bg-gray-800 px-4 py-1">Login Activity</a>
          <a className="block hover:bg-gray-800 px-4 py-1">IP Tracking</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Token Revocation</a>
        </MenuItem>

        <MenuItem icon="🔄" title="Backups / Logs" name="backups">
          <a className="block hover:bg-gray-800 px-4 py-1">Database Backup</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Error Logs</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Activity Logs</a>
        </MenuItem>

        <MenuItem icon="👤" title="Profile / Logout" name="profile">
          <a className="block hover:bg-gray-800 px-4 py-1">My Profile</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Change Password</a>
          <a className="block hover:bg-gray-800 px-4 py-1">Logout</a>
        </MenuItem>

        <MenuItem icon="🧩" title="Optional Items" name="optional">
          <a className="block hover:bg-gray-800 px-4 py-1">💼 Subscription Plans</a>
          <a className="block hover:bg-gray-800 px-4 py-1">💰 Billing/Invoices</a>
          <a className="block hover:bg-gray-800 px-4 py-1">🌐 API Access Control</a>
          <a className="block hover:bg-gray-800 px-4 py-1">🧪 Test Module Management</a>
          <a className="block hover:bg-gray-800 px-4 py-1">🛎️ Announcements & Notices</a>
        </MenuItem>
      </nav>
    </aside>
  );
};

export default Sidebar;
