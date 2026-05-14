import React from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const ReportsChart = () => {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [
      { label: "Students", data: [100, 120, 150, 170], backgroundColor: "skyblue" },
      { label: "Fees", data: [20000, 25000, 30000, 35000], backgroundColor: "lightgreen" },
    ],
  };

  return (
    <div className="space-y-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
            <Bar data={data} className="w-full" />
        </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Line data={data} className="w-full" />
      </div>
     <div   className="bg-white p-4 rounded-lg shadow-md"> 
         <Pie data={data} className="w-full" />
     </div>
    </div>
  );
};

export default ReportsChart;
