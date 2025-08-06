import { Bell, MessageSquare, Search, Menu, X } from 'lucide-react';
import UserDropdown from './UserDropdown';
import NotificationDropdown from './NotificationDropdown';
import AcademicYearSwitcher from '../layout/AcademicYearSwitcher';
import { useSelector } from 'react-redux';
const Topbar = ({ toggleSidebar, isOpen }) => {
  const {user} = useSelector((state)=>state.auth)
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b transition-all duration-300">
      {/* Mobile Sidebar Toggle Button */}
      <button
        className="p-2 text-deep-purple-600 block md:hidden"
        onClick={toggleSidebar}
        type="button"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Search Bar */}
      <div className="hidden md:flex items-center bg-gray-100 px-3 py-2 rounded-full w-72">
        <Search className="w-4 h-4 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent focus:outline-none text-sm flex-1"
        />
        <div className="ml-2 text-xs text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded-md">
          ⌘ K
        </div>
      </div>

      {/* Icons and Profile */}
      <div className="flex items-center gap-4 ml-auto">
       {user?.role?.name === "Super Admin" ? "" : <AcademicYearSwitcher onChange={(year) => console.log("Switched to:", year)} /> } 

        {/* Chat Icon */}
        <button className="relative text-gray-600 hover:text-black">
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Notification Dropdown */}
        <NotificationDropdown />

        {/* User Dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
};

export default Topbar;
