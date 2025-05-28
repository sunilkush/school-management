import Sidebar from '../sidebar/Sidebar';
import Topbar from '../navbar/Topbar';
import { Outlet } from 'react-router-dom';
const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar  />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <Topbar/>
       
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet/>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
