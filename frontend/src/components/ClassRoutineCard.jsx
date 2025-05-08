import React from "react";

const classRoutines = [
  {
    img: "https://randomuser.me/api/portraits/women/1.jpg",
    month: "Oct 2024",
    color: "bg-blue-500",
    percent: "80%",
  },
  {
    img: "https://randomuser.me/api/portraits/men/2.jpg",
    month: "Nov 2024",
    color: "bg-yellow-400",
    percent: "75%",
  },
  {
    img: "https://randomuser.me/api/portraits/women/3.jpg",
    month: "Oct 2024",
    color: "bg-green-500",
    percent: "95%",
  },
];

const ClassRoutineCard = () => {
  return (
    <div className="bg-white rounded-md p-4 shadow w-full ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg text-gray-800">Class Routine</h2>
        <button className="text-blue-500 text-sm hover:underline">
          <i className="fas fa-plus mr-1"></i> Add New
        </button>
      </div>

      {classRoutines.map((routine, idx) => (
        <div key={idx} className="flex items-center space-x-3 mb-4">
          <img
            src={routine.img}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="w-full">
            <div className="text-sm text-gray-600 font-medium mb-1">{routine.month}</div>
            <div className="w-full bg-gray-200 h-2 rounded">
              <div
                className={`h-2 ${routine.color} rounded`}
                style={{ width: routine.percent }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClassRoutineCard;
