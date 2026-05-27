import React from "react";

export function Card({ children, className = "" }) {
  return <div className={`class-card class-card-hover fade-up ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`class-card-content ${className}`}>{children}</div>;
}
