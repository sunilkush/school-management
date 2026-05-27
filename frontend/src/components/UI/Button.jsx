import React from "react";

export function Button({ children, onClick, className = "", variant = "default", size = "md", type = "button" }) {
  const base = "class-button";
  const variants = {
    default: "class-gradient-button",
    outline: "class-button-outline",
    ghost: "class-button-ghost",
  };

  const sizes = {
    sm: "class-button-sm",
    md: "class-button-md",
    lg: "class-button-lg",
  };

  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.md} ${className}`}>
      {children}
    </button>
  );
}
