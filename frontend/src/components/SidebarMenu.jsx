import React, { useState } from "react";
import {
  FaThLarge,
  FaSchool,
  FaUserGraduate,
  FaUserFriends,
  FaUsers,
  FaChalkboardTeacher,
  FaAngleDown,
  FaMoon,
  FaTh,
  FaListUl,
  FaColumns,
  FaFlag,
} from "react-icons/fa";

const SidebarMenu = () => {
  const [studentOpen, setStudentOpen] = useState(true);

  return (
    <div className="w-64 min-h-screen bg-white shadow-md text-sm text-gray-700 p-4 space-y-6">
      {/* Logo */}
      <div className="flex items-center mb-4">
        <img src="/logo.png" alt="logo" className="w-6 h-6 mr-2" />
        <span className="text-xl font-semibold">Pre<span className="text-blue-600">Skool</span></span>
      </div>

      {/* School Name */}
      <div className="bg-gray-100 p-2 rounded-md text-center text-xs font-medium">
        Global International
      </div>

      {/* Main Section */}
      <div>
        <p className="text-gray-400 text-xs mt-4 mb-2 uppercase">Main</p>
        <div className="space-y-2">
          <button className="flex items-center px-2 py-1.5 rounded bg-blue-50 text-blue-700">
            <FaThLarge className="mr-2" /> Dashboard
          </button>
          <button className="flex items-center px-2 py-1.5 hover:bg-gray-100 w-full">
            <FaSchool className="mr-2" /> Application
          </button>
        </div>
      </div>

      {/* Layout Section */}
      <div>
        <p className="text-gray-400 text-xs mt-4 mb-2 uppercase">Layout</p>
        <div className="space-y-2">
          <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"><FaTh className="mr-2" /> Default</div>
          <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"><FaFlag className="mr-2" /> Mini</div>
          <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"><FaColumns className="mr-2" /> RTL</div>
          <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"><FaListUl className="mr-2" /> Box</div>
          <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"><FaMoon className="mr-2" /> Dark</div>
        </div>
      </div>

      {/* People Section */}
      <div>
        <p className="text-gray-400 text-xs mt-4 mb-2 uppercase">Peoples</p>

        {/* Students Dropdown */}
        <div>
          <button
            className="flex justify-between items-center w-full px-2 py-1.5 bg-blue-50 text-blue-700 rounded"
            onClick={() => setStudentOpen(!studentOpen)}
          >
            <span className="flex items-center">
              <FaUserGraduate className="mr-2" /> Students
            </span>
            <FaAngleDown className={`transition-transform ${studentOpen ? "rotate-180" : ""}`} />
          </button>
          {studentOpen && (
            <div className="ml-6 mt-2 space-y-1 text-gray-600">
              <div className="hover:underline cursor-pointer">All Students</div>
              <div className="hover:underline cursor-pointer">Student List</div>
              <div className="hover:underline cursor-pointer">Student Details</div>
              <div className="hover:underline cursor-pointer">Student Promotion</div>
            </div>
          )}
        </div>

        {/* Other People Sections */}
        <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer mt-2">
          <FaUserFriends className="mr-2" /> Parents
        </div>
        <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer">
          <FaUsers className="mr-2" /> Guardians
        </div>
        <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer">
          <FaChalkboardTeacher className="mr-2" /> Teachers
        </div>
      </div>

      {/* Academic Section */}
      <div>
        <p className="text-gray-400 text-xs mt-4 mb-2 uppercase">Academic</p>
        {/* Add your academic menu items here */}
      </div>
    </div>
  );
};

export default SidebarMenu;
