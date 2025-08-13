import React from "react";

const SummaryCards = ({ totalStudents, feesCollected, presentPercent }) => {
  const cards = [
    { title: "Total Students", value: totalStudents },
    { title: "Fees Collected", value: `₹${feesCollected.toLocaleString()}` },
    { title: "Present %", value: `${presentPercent}%` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white shadow rounded-lg p-4 text-center border"
        >
          <h2 className="text-sm text-gray-500">{card.title}</h2>
          <p className="text-xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
