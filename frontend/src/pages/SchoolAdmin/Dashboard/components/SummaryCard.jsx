import React from 'react';

const SummaryCard = ({ title, value, percentage, trend, color, label }) => {
  const ringColor = {
    purple: 'text-deep-purple-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
  }[color];

  const textColor = trend.includes('Decrease') ? 'text-red-500' : 'text-green-500';

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h2 className="text-xl font-semibold">{value}</h2>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={ringColor}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${percentage}, 100`}
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="flex justify-between text-sm mt-4">
        <span className={textColor}>{trend}</span>
        <span className="text-gray-400">{label}</span>
      </div>
    </div>
  );
};

export default SummaryCard;
