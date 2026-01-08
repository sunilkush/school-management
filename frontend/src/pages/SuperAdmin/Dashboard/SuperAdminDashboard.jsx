import React from "react";
import {
  School,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const stats = [
  { title: "Total Schools", count: 18, icon: <School className="w-6 h-6" /> },
  { title: "Admins", count: 42, icon: <Users className="w-6 h-6" /> },
  { title: "Roles", count: 12, icon: <ShieldCheck className="w-6 h-6" /> },
  { title: "Settings", count: 1, icon: <Settings className="w-6 h-6" /> },
];

const shortcuts = [
  { title: "Manage Schools", path: "/dashboard/superadmin/schools", icon: <School /> },
  { title: "Admins", path: "/dashboard/superadmin/users/admins", icon: <Users /> },
  { title: "Roles", path: "/dashboard/superadmin/settings/roles", icon: <ShieldCheck /> },
  { title: "Settings", path: "/dashboard/superadmin/settings", icon: <Settings /> },
];

const SuperAdminDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-4">Welcome, Super Admin</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
          >
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">{item.icon}</div>
            <div>
              <h2 className="text-lg font-semibold">{item.count}</h2>
              <p className="text-sm text-gray-500">{item.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shortcuts */}
      <h2 className="text-xl font-semibold mb-3">Quick Access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {shortcuts.map((item, idx) => (
          <a
            key={idx}
            href={item.path}
            className="border hover:shadow-md transition bg-white rounded-xl p-4 flex items-center gap-3"
          >
            <div className="p-2 bg-gray-100 rounded">{item.icon}</div>
            <span className="text-gray-800 font-medium">{item.title}</span>
          </a>
        ))}
      </div>

      {/* Activity / Log */}
      <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
      <div className="bg-white p-4 border rounded-xl text-sm text-gray-600">
        <ul className="space-y-2">
          <li>✅ Sunil created a new school: “Green Valley High”</li>
          <li>🛠️ Role “Teacher” was updated with new permissions</li>
          <li>📤 Admin “Rajesh” was added to School #12</li>
        </ul>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
