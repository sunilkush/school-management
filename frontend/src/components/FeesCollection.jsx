import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Q1: 2023", total: 75, collected: 30 },
  { name: "Q1: 2023", total: 90, collected: 40 },
  { name: "Q1: 2023", total: 85, collected: 38 },
  { name: "Q1: 2023", total: 90, collected: 40 },
  { name: "Q1: 2023", total: 85, collected: 38 },
  { name: "uQ1: 2023I", total: 70, collected: 30 },
  { name: "Q1: 2023", total: 75, collected: 34 },
  { name: "Q1: 2023", total: 88, collected: 38 },
  { name: "Q1: 2023", total: 95, collected: 40 },
];

const FeesCollection = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Fees Collection</h2>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <span className="material-icons text-base">calendar_today</span>
          Last 8 Quarters
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend
            formatter={(value) => (
              <span className="text-sm text-gray-600">{value === "collected" ? "Collected Fee" : "Total Fee"}</span>
            )}
          />
          <Bar dataKey="collected" stackId="a" fill="#3b82f6" name="Collected Fee" />
          <Bar dataKey="total" stackId="a" fill="#e5e7eb" name="Total Fee" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeesCollection;
