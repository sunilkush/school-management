import React from "react";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUsers,
  FaBook
} from "react-icons/fa";

const stats = [
  {
    icon: <FaUserGraduate className="text-5xl text-indigo-500" />,
    label: "Total Students",
    total: 3654,
    active: 3643,
    inactive: 11,
    badgeColor: "bg-red-500",
    badgeText: "1.2%",
  },
  {
    icon: <FaChalkboardTeacher className="text-5xl text-sky-500" />,
    label: "Total Teachers",
    total: 284,
    active: 254,
    inactive: 30,
    badgeColor: "bg-sky-400",
    badgeText: "1.2%",
  },
  {
    icon: <FaUsers className="text-5xl text-yellow-500" />,
    label: "Total Staff",
    total: 162,
    active: 161,
    inactive: 2,
    badgeColor: "bg-yellow-400",
    badgeText: "1.2%",
  },
  {
    icon: <FaBook className="text-5xl text-purple-500" />,
    label: "Total Subjects",
    total: 82,
    active: 81,
    inactive: 1,
    badgeColor: "bg-green-500",
    badgeText: "1.2%",
  },
];

const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-full p-2">
                {stat.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{stat.total}</h2>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
            <span className={`text-white text-xs font-medium px-2 py-1 rounded ${stat.badgeColor}`}>
              {stat.badgeText}
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>Active : <strong>{stat.active}</strong></span>
            <span>|</span>
            <span>Inactive : <strong>{stat.inactive.toString().padStart(2, '0')}</strong></span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
