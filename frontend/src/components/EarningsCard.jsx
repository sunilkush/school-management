import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { FaUsers } from "react-icons/fa";

const data = [
  { value: 30000 },
  { value: 65000 },
  { value: 10000 },
  { value: 40000 },
  { value: 32000 },
  { value: 50000 },
  { value: 45000 },
];

const EarningsCard = () => {
  return (
    <div className="bg-white rounded-md p-4 shadow w-full max-w-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
          <h3 className="text-2xl font-bold text-gray-800">$64,522.24</h3>
        </div>
        <div className="bg-blue-600 text-white p-2 rounded">
          <FaUsers />
        </div>
      </div>

      <div className="h-24 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              fillOpacity={0.2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EarningsCard;
