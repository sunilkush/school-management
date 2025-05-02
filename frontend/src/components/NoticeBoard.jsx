import React from "react";
import {
  FaBookOpen,
  FaGlobe,
  FaBell,
  FaLaptop,
  FaCalendarAlt
} from "react-icons/fa";

const notices = [
  {
    icon: <FaBookOpen className="text-indigo-500" />,
    title: "New Syllabus Instructions",
    date: "11 Mar 2024",
    days: "20 Days"
  },
  {
    icon: <FaGlobe className="text-green-500" />,
    title: "World Environment Day Program.....!!!",
    date: "21 Apr 2024",
    days: "15 Days"
  },
  {
    icon: <FaBell className="text-red-400" />,
    title: "Exam Preparation Notification!",
    date: "13 Mar 2024",
    days: "12 Days"
  },
  {
    icon: <FaLaptop className="text-sky-500" />,
    title: "Online Classes Preparation",
    date: "24 May 2024",
    days: "02 Days"
  },
  {
    icon: <FaCalendarAlt className="text-yellow-500" />,
    title: "Exam Time Table Release",
    date: "24 May 2024",
    days: "06 Days"
  }
];

const NoticeBoard = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Notice Board</h2>
        <button className="text-sm text-blue-600 hover:underline">View All</button>
      </div>
      <ul className="space-y-4">
        {notices.map((notice, index) => (
          <li key={index} className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="text-xl">{notice.icon}</div>
              <div>
                <h3 className="font-medium text-gray-800">{notice.title}</h3>
                <p className="text-sm text-gray-500">Added on : {notice.date}</p>
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full self-center">
              {notice.days}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoticeBoard;
