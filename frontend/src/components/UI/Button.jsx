// src/components/UI/button.jsx
import React from "react";

export function Button({ children, onClick, className = "", variant = "default", size = "md", type = "button" }) {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
  };
  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
