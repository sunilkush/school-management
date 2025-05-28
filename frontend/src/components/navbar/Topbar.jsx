import { Bell, MessageSquare, Search } from 'lucide-react';

const Topbar = () => {
    
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center bg-gray-100 px-3 py-2 rounded-full w-72">
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
      <div className="flex items-center gap-4">
        {/* Chat */}
        <button className="relative text-gray-600 hover:text-black">
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Notification */}
        <button className="relative text-gray-600 hover:text-black">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        {/* Avatar */}
        <div className="flex items-center space-x-2">
          <img
            src="https://i.pravatar.cc/40?img=3"
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium text-gray-700">Estiaq Noor</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
