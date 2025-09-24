import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const chartData = [
  { month: 'Jan', Sales: 60, Marketing: -60 },
  { month: 'Feb', Sales: 50, Marketing: -40 },
  { month: 'Mar', Sales: 60, Marketing: -50 },
  { month: 'Apr', Sales: 70, Marketing: -30 },
  { month: 'May', Sales: 60, Marketing: -50 },
  { month: 'Jun', Sales: 80, Marketing: -45 },
  { month: 'Jul', Sales: 60, Marketing: -35 },
  { month: 'Aug', Sales: 70, Marketing: -55 },
  { month: 'Sep', Sales: 80, Marketing: -50 },
  { month: 'Oct', Sales: 60, Marketing: -40 },
  { month: 'Nov', Sales: 75, Marketing: -45 },
];

const TotalSalaryByUnit = () => {
  const [selected, setSelected] = useState('Sales');

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Total Salary by Unit</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelected('Sales')}
              className={`w-5 h-5 rounded-full ${
                selected === 'Sales' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
            <span className={`${selected === 'Sales' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Sales</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelected('Marketing')}
              className={`w-5 h-5 rounded-full ${
                selected === 'Marketing' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
            <span className={`${selected === 'Marketing' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Marketing</span>
          </div>
          <div className="border px-2 py-1 bg-gray-100 rounded text-gray-500">Daily</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis domain={[-100, 100]} />
          <Tooltip />
          {selected === 'Sales' && <Bar dataKey="Sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />}
          {selected === 'Marketing' && <Bar dataKey="Marketing" fill="#60a5fa" radius={[8, 8, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TotalSalaryByUnit;
