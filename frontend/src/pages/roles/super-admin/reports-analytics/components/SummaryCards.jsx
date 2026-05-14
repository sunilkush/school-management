import React from "react";

const SummaryCards = ({ data = [] }) => {
  console.log("SummaryCards data:", data);
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500">No summary data available</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="bg-white shadow rounded-lg p-4 text-center border"
        >
          <h2 className="text-sm text-gray-500">{item.title}</h2>
          <p className="text-xl font-bold">
            {typeof item.value === "number" && item.format === "currency"
              ? `₹${item.value.toLocaleString()}`
              : item.format === "percent"
              ? `${item.value}%`
              : item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
