import React from "react";
import { Tag } from "antd";

const colorMap = { draft: "orange", locked: "blue", paid: "green" };

const PayrollCycleStatus = ({ status }) => {
  if (!status) return null;
  return <Tag color={colorMap[status] || "default"}>Cycle: {status.toUpperCase()}</Tag>;
};

export default PayrollCycleStatus;
