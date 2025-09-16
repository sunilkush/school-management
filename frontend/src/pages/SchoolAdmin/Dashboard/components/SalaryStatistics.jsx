import React from 'react';

const stats = [
  { title: 'Developer', value: '6k USD', height: 'h-32', color: 'bg-indigo-400' },
  { title: 'Marketing', value: '3k USD', height: 'h-24', color: 'bg-indigo-300' },
  { title: 'Sales', value: '2k USD', height: 'h-16', color: 'bg-indigo-200' },
];

const SalaryStatistics = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Salary Statistics</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <select className="border px-2 py-1 rounded text-sm text-gray-600">
              <option>Last month</option>
            </select>
        </div>
      </div>

      <div className="flex items-end  justify-between space-x-4">
        {stats.map((item, index) => (
          <div key={index} className="flex flex-col items-center justify-end flex-1">
            <div className="mb-2 text-center">
              <p className="text-sm text-gray-500">{item.title}</p>
              <p className="text-lg font-semibold text-gray-900">{item.value}</p>
            </div>
            <div
              className={`${item.height} ${item.color} w-full rounded-t-md transition-all duration-300`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalaryStatistics;
