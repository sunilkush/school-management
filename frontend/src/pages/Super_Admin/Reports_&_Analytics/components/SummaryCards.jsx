import React from "react";

const formatSummaryValue = (item = {}) => {
  const value = item.value;

  if (typeof value === "number" && item.format === "currency") {
    return `₹${value.toLocaleString()}`;
  }

  if (item.format === "percent") {
    return `${value ?? 0}%`;
  }

  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return value.message || JSON.stringify(value);

  return "-";
};

const SummaryCards = ({ data = [] }) => {
  const items = Array.isArray(data) ? data : [];

  if (items.length === 0) {
    return <div className="text-center text-gray-500">No summary data available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <div
          key={`${item.title || "summary"}-${idx}`}
          className="bg-white shadow rounded-lg p-4 text-center border"
        >
          <h2 className="text-sm text-gray-500">{item.title || "Summary"}</h2>
          <p className="text-xl font-bold">{formatSummaryValue(item)}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
