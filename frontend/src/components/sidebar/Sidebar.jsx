import { Home } from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import { useSelector } from 'react-redux';

export default function Sidebar({ isOpen }) {
  const token = localStorage.getItem('accessToken');
  const { user } = useSelector((state) => state.auth);
  const role = user?.role?.name?.toLowerCase();

  if (!token) {
    return (
      <aside className="w-64 h-screen bg-white flex items-center justify-center">
        <span className="text-gray-400">Authenticating...</span>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-72 bg-white border-r transition-transform duration-300 z-40
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0 md:relative md:block`}
    >
      <div>
        <div className="p-6 text-purple-600 font-bold text-xl flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-full">
            <Home size={20} />
          </div>
          <span>{user?.school?.name}</span>
        </div>
        <hr className="border-gray-100" />
        <SidebarMenu role={role} />
      </div>
    </aside>
  );
}
