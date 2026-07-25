import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Bar, Pie, Line } from "react-chartjs-2";
import dayjs from "dayjs";
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

const REPORT_TYPES = ["fees", "students", "attendance", "performance", "custom"];
const TYPE_COLORS = ["#38bdf8", "#4ade80", "#facc15", "#a78bfa", "#fb923c"];

const ReportsChart = () => {
  const { items = [] } = useSelector((state) => state.reports || {});

  const byType = useMemo(() => {
    const counts = Object.fromEntries(REPORT_TYPES.map((t) => [t, 0]));
    items.forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type] += 1;
    });
    return {
      labels: REPORT_TYPES.map((t) => t[0].toUpperCase() + t.slice(1)),
      datasets: [{ label: "Reports", data: REPORT_TYPES.map((t) => counts[t]), backgroundColor: TYPE_COLORS }],
    };
  }, [items]);

  const byStatus = useMemo(() => {
    const draft = items.filter((r) => r.status === "draft").length;
    const finalized = items.filter((r) => r.status === "finalized").length;
    return {
      labels: ["Draft", "Finalized"],
      datasets: [{ data: [draft, finalized], backgroundColor: ["#facc15", "#4ade80"] }],
    };
  }, [items]);

  const byMonth = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, "month"));
    const counts = months.map(
      (m) => items.filter((r) => dayjs(r.createdAt).isSame(m, "month")).length
    );
    return {
      labels: months.map((m) => m.format("MMM")),
      datasets: [{ label: "Reports Generated", data: counts, borderColor: "#38bdf8", backgroundColor: "#38bdf822" }],
    };
  }, [items]);

  if (!items.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-gray-500 text-sm">
        No reports yet — charts will populate once reports are generated.
      </div>
    );
  }

  return (
    <div className="space-y-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-xs font-semibold text-gray-500 mb-2">Reports by Type</p>
        <Bar data={byType} className="w-full" options={{ plugins: { legend: { display: false } } }} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-xs font-semibold text-gray-500 mb-2">Reports Generated (Last 6 Months)</p>
        <Line data={byMonth} className="w-full" />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-xs font-semibold text-gray-500 mb-2">Draft vs Finalized</p>
        <Pie data={byStatus} className="w-full" />
      </div>
    </div>
  );
};

export default ReportsChart;
