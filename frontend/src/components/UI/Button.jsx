import React from "react";

export function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary: "bg-brand text-surface hover:bg-primary-dark",
    accent: "bg-accent text-dark hover:brightness-95",
    outline: "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-brand-soft)]",
    ghost: "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-brand-soft)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
    >
      {children}
    </button>
  );
}
