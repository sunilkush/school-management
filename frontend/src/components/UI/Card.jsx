import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] shadow-[0_6px_18px_rgba(2,2,2,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-4 md:p-5 ${className}`}>{children}</div>;
}
