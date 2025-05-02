// /src/components/AttendanceChart.jsx

import React, { useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';

const AttendanceChart = () => {
  const [tab, setTab] = useState('Students');

  const data = [
    { name: 'Emergency', value: 28 },
    { name: 'Absent', value: 1 },
    { name: 'Late', value: 1 },
    { name: 'Present', value: 970 },
  ];

  const COLORS = ['#4F46E5', '#06b6d4', '#facc15', '#e5e7eb'];

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const presentPercent = ((data[3].value / total) * 100).toFixed(1); // Assuming index 3 is "Present"

  const tabs = ['Students', 'Teachers', 'Staff'];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Attendance</h2>
        <span className="text-sm text-gray-500">Today</span>
      </div>

      <div className="flex space-x-6 border-b border-gray-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium ${
              tab === t
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div>
          <p className="text-xl font-semibold">28</p>
          <p className="text-xs text-gray-500">Emergency</p>
        </div>
        <div>
          <p className="text-xl font-semibold">01</p>
          <p className="text-xs text-gray-500">Absent</p>
        </div>
        <div>
          <p className="text-xl font-semibold">01</p>
          <p className="text-xs text-gray-500">Late</p>
        </div>
      </div>

      <div className="flex justify-center">
        <PieChart width={160} height={160}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            fill="#8884d8"
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
        <div className="absolute mt-[60px] text-sm font-bold text-blue-700">
          {presentPercent}%
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md flex items-center gap-2">
          📅 View All
        </button>
      </div>
    </div>
  );
};

export default AttendanceChart;
