import React from "react";

const AutosaveIndicator = ({ status }) => {
  const color =
    status === "saving"
      ? "text-yellow-500"
      : status === "saved"
      ? "text-green-500"
      : "text-gray-400";

  return (
    <div className={`text-sm mt-2 ${color}`}>
      {status === "saving" && "💾 Saving..."}
      {status === "saved" && "✅ All changes saved"}
      {status === "idle" && "✏️ Waiting for input"}
    </div>
  );
};

export default AutosaveIndicator;
