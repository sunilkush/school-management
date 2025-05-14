import React from "react";
import { FaCalendarAlt, FaClipboardCheck, FaClipboardList, FaMoneyCheckAlt, FaBook, FaFileAlt } from "react-icons/fa";

const quickLinks = [
  { name: "Calendar", icon: <FaCalendarAlt />, bg: "bg-green-100", iconBg: "bg-green-500" },
  { name: "Exam Result", icon: <FaClipboardCheck />, bg: "bg-blue-100", iconBg: "bg-blue-500" },
  { name: "Attendance", icon: <FaClipboardList />, bg: "bg-yellow-100", iconBg: "bg-yellow-500" },
  { name: "Fees", icon: <FaMoneyCheckAlt />, bg: "bg-cyan-100", iconBg: "bg-cyan-500" },
  { name: "Home Works", icon: <FaBook />, bg: "bg-red-100", iconBg: "bg-red-500" },
  { name: "Reports", icon: <FaFileAlt />, bg: "bg-pink-100", iconBg: "bg-pink-500" },
];

const QuickLinks = () => {
  return (
    <div className="bg-white rounded-md shadow p-4">
      <h2 className="font-semibold text-lg mb-4">Quick Links</h2>
      <div className="grid grid-cols-3 gap-4">
        {quickLinks.map((item, index) => (
          <div
            key={index}
            className={`${item.bg} p-4 rounded flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer`}
          >
            <div className={`text-white text-xl p-2 rounded-full ${item.iconBg} mb-2`}>
              {item.icon}
            </div>
            <span className="text-sm font-medium text-gray-800 text-center">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
