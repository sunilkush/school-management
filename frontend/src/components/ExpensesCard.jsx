import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { FaUsers } from "react-icons/fa";

const data = [
  { value: 10000 },
  { value: 5000 },
  { value: 30000 },
  { value: 28000 },
  { value: 29000 },
  { value: 31000 },
  { value: 26000 },
];

const ExpensesCard = () => {
  return (
    <div className="bg-white rounded-md p-4 shadow w-full max-w-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
          <h3 className="text-2xl font-bold text-gray-800">$60,522.24</h3>
        </div>
        <div className="bg-red-600 text-white p-2 rounded">
          <FaUsers />
        </div>
      </div>

      <div className="h-24 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ef4444"
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

export default ExpensesCard;
