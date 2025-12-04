import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import Topbar from '../navbar/Topbar';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);
  
  const role = user?.role?.name;

  // ✅ Redirect if not Super Admin and no active academic year
  useEffect(() => {
    if (role !== 'Super Admin' && !activeYear?._id) {
      // Example redirect (optional)
      // navigate('/no-active-year');
    }
  }, [role, activeYear, navigate]);

  // ✅ Auto hide sidebar when screen < 1024px (tablet or mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Overlay for mobile and tablet */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          isSidebarOpen && window.innerWidth >= 1023 ?  'ml-0' : 'xl:ml-72'
        }`}
      >
        {/* Topbar */}
        <Topbar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
