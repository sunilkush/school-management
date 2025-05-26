import React from 'react';
import {
  FaBars, FaCalendarAlt, FaBell, FaFlagUsa, FaMoon, FaCommentDots, FaChartBar, FaExpand
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Outlet } from 'react-router-dom';

const SuperAdmin = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar */}
     <Sidebar/>

      {/* Main Content */}
      <div className="flex-1">

        {/* Topbar */}
       <Topbar/>

        {/* Dashboard Content */}
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Welcome Back, Mr. Herald</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <Outlet/>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdmin;
