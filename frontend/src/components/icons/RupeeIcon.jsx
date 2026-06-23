import React from "react";

const RupeeIcon = ({ size, style, className, strokeWidth, ...rest }) => (
  <span
    role="img"
    aria-label="rupee"
    className={`anticon ${className || ""}`}
    style={{
      fontStyle: "normal",
      fontWeight: 700,
      lineHeight: 1,
      fontSize: size ?? style?.fontSize ?? 14,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    }}
    {...rest}
  >
    ₹
  </span>
);

export default RupeeIcon;
