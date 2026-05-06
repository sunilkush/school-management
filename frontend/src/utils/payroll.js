import dayjs from "dayjs";

export const formatCurrencyINR = (value = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatPayrollMonth = (month, year) =>
  dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY");

export const getPayrollActionPermissions = (roleName, cycleStatus) => {
  const role = (roleName || "").toLowerCase();
  const fullAccess = ["super admin", "school admin", "accountant"].includes(role);
  const reviewAccess = ["super admin", "school admin", "accountant", "principal", "admin"].includes(role);

  return {
    canGenerate: fullAccess && (!cycleStatus || cycleStatus === "draft"),
    canLock: reviewAccess && cycleStatus === "draft",
    canPay: fullAccess && cycleStatus === "locked",
  };
};
