import React from "react";
import { FaCalendarAlt, FaClock, FaUserFriends, FaPlus } from "react-icons/fa";

const events = [
  {
    title: "Parents, Teacher Meet",
    date: "15 July 2024",
    time: "09:10AM - 10:50PM",
    attendees: [
      "/avatars/avatar1.png",
      "/avatars/avatar2.png",
    ],
  },
  {
    title: "Parents, Teacher Meet",
    date: "15 July 2024",
    time: "09:10AM - 10:50PM",
    attendees: [
      "/avatars/avatar3.png",
      "/avatars/avatar4.png",
      "/avatars/avatar5.png",
    ],
  },
];

const ScheduleWidget = () => {
  return (
    <div className="bg-white rounded-md shadow-md p-4 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Schedules</h2>
        <button className="flex items-center text-sm text-blue-600">
          <FaPlus className="mr-1" /> Add New
        </button>
      </div>

      {/* Calendar header */}
      <div className="text-center text-sm text-gray-600 mb-2">
        <div className="flex items-center justify-between mb-2 px-4">
          <button>&lt;</button>
          <span className="font-semibold text-gray-800">May 2025</span>
          <button>&gt;</button>
        </div>

        {/* Static Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-3">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center font-medium">{day}</div>
          ))}
          {Array.from({ length: 31 + 5 }).map((_, i) => {
            const day = i - 4;
            return (
              <div
                key={i}
                className={`text-center py-1 rounded ${
                  day === 2 ? "bg-blue-600 text-white" : ""
                }`}
              >
                {day > 0 && day <= 31 ? day : ""}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Upcoming Events</h3>
        {events.map((event, idx) => (
          <div key={idx} className="bg-gray-50 border-l-4 border-blue-500 p-3 rounded mb-3">
            <div className="flex items-center text-sm mb-1 font-semibold">
              <FaUserFriends className="text-blue-600 mr-2" />
              {event.title}
            </div>
            <div className="flex items-center text-xs text-gray-600 mb-1">
              <FaCalendarAlt className="mr-2" />
              {event.date}
            </div>
            <div className="flex items-center text-xs text-gray-600 justify-between">
              <div className="flex items-center">
                <FaClock className="mr-2" />
                {event.time}
              </div>
              <div className="flex -space-x-2">
                {event.attendees.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="avatar"
                    className="w-6 h-6 rounded-full border-2 border-white"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleWidget;
