// /src/components/PerformanceChart.jsx

import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, School } from 'lucide-react';

const data = [
  { name: 'Top', value: 45 },
  { name: 'Average', value: 11 },
  { name: 'Below Avg', value: 2 },
];

const COLORS = ['#3B82F6', '#FACC15', '#EF4444']; // Blue, Yellow, Red

const PerformanceChart = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
      {/* Left Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Performance</h2>
          <div className="flex items-center text-sm text-gray-500 space-x-1 ml-4">
            <School size={16} />
            <span>Class II</span>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border border-dashed rounded px-3 py-2">
            <span className="flex items-center gap-2 text-blue-600">
              ▾ Top
            </span>
            <span className="font-semibold text-gray-700">45</span>
          </div>
          <div className="flex items-center justify-between border border-dashed rounded px-3 py-2">
            <span className="flex items-center gap-2 text-yellow-500">
              ▾ Average
            </span>
            <span className="font-semibold text-gray-700">11</span>
          </div>
          <div className="flex items-center justify-between border border-dashed rounded px-3 py-2">
            <span className="flex items-center gap-2 text-red-500">
              ▾ Below Avg
            </span>
            <span className="font-semibold text-gray-700">02</span>
          </div>
        </div>
      </div>

      {/* Right Section - Donut Chart */}
      <div className="pt-4">
        <PieChart width={130} height={130}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            fill="#8884d8"
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </div>
    </div>
  );
};

export default PerformanceChart;
