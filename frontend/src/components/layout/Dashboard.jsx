import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import Topbar from '../navbar/Topbar';
import { Outlet } from 'react-router-dom';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);
  console.log("Active Academic Year:", activeYear);
  const role = user?.role?.name;
  // ✅ BLOCK IF NO ACTIVE YEAR AND NOT SUPER ADMIN
  useEffect(() => {
    if (role !== 'Super Admin' && !activeYear?._id) {
      alert('Please select or create an academic year to continue.');
     // navigate('/');
    }
  }, [role, activeYear, navigate]);

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 md:ml-0 ${isSidebarOpen ? 'ml-72' : ''
          }`}
      >
        <Topbar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
