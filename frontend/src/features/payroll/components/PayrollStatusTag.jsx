import React from "react";
import { Tag } from "antd";
const COLORS = { draft: "default", processing: "processing", review: "warning", approved: "success", paid: "blue", locked: "purple", cancelled: "error", failed: "error", published: "green", generated: "cyan", pending: "gold", active: "green", inactive: "default" };
const PayrollStatusTag = ({ status }) => <Tag color={COLORS[String(status || "draft").toLowerCase()] || "default"}>{String(status || "draft").replaceAll("_", " ").toUpperCase()}</Tag>;
export default PayrollStatusTag;
