import React from "react";

const ExportButtons = () => {
  const buttons = ["PDF", "Excel", "CSV", "Print"];

  return (
    <div className="flex gap-2">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {btn}
        </button>
      ))}
    </div>
  );
};

export default ExportButtons;
