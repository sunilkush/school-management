import React from "react";
import { FaCheck, FaTimes, FaCalendarAlt } from "react-icons/fa";

const leaveRequests = [
  {
    name: "James",
    type: "Emergency",
    typeColor: "bg-red-100 text-red-500",
    role: "Physics Teacher",
    dateRange: "12 -13 May",
    applyDate: "12 May",
    img: "https://i.pravatar.cc/50?img=1",
  },
  {
    name: "Ramien",
    type: "Casual",
    typeColor: "bg-yellow-100 text-yellow-600",
    role: "Accountant",
    dateRange: "12 -13 May",
    applyDate: "11 May",
    img: "https://i.pravatar.cc/50?img=2",
  },
];

const LeaveRequests = () => {
  return (
    <div className="bg-white p-4 rounded-md shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Leave Requests</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-blue-600">
          <FaCalendarAlt className="text-base" />
          <span>Today</span>
        </div>
      </div>

      {leaveRequests.map((leave, index) => (
        <div key={index} className="bg-gray-50 rounded p-4 mb-3 flex items-start justify-between">
          <div className="flex gap-4">
            <img src={leave.img} alt={leave.name} className="w-12 h-12 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{leave.name}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${leave.typeColor}`}>
                  {leave.type}
                </span>
              </div>
              <p className="text-sm text-gray-600">{leave.role}</p>
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-gray-800">Leave :</span> {leave.dateRange}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div className="mb-2 flex gap-2 justify-end">
              <button className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600">
                <FaCheck />
              </button>
              <button className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                <FaTimes />
              </button>
            </div>
            <span>
              <span className="font-medium text-gray-800">Apply on :</span> {leave.applyDate}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaveRequests;
