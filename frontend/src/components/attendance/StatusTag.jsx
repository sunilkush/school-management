import React from "react";
import { Tag } from "antd";

const colorMap = {
  present: "green",
  absent: "red",
  late: "orange",
  halfday: "gold",
  leave: "blue",
};

const StatusTag = ({ status }) => {
  const normalized = (status || "").toLowerCase();
  return <Tag color={colorMap[normalized] || "default"}>{normalized || "n/a"}</Tag>;
};

export default StatusTag;
