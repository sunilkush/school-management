import React from "react";
export const rolePermissions = {
  "Super Admin": ["*"],
  "School Admin": ["payroll.*"],
  Principal: ["payroll.approve", "payroll.reports.view", "payroll.dashboard.view", "payroll.audit.view"],
  Accountant: ["payroll.workspace.view", "payroll.cycles.manage", "payroll.runs.manage", "payroll.payslips.manage", "payroll.bankExport.manage", "payroll.reports.view", "payroll.adjustments.manage"],
  HR: ["payroll.salaryStructure.manage", "payroll.salaryRevision.manage", "payroll.loans.manage", "payroll.tax.manage", "payroll.employeeProfile.view"],
  Teacher: ["payroll.self.view", "payroll.self.payslips.view", "payroll.self.salaryStructure.view", "payroll.self.loans.manage", "payroll.self.tax.manage"],
  Staff: ["payroll.self.view", "payroll.self.payslips.view", "payroll.self.salaryStructure.view", "payroll.self.loans.manage", "payroll.self.tax.manage"],
  Auditor: ["payroll.reports.view", "payroll.audit.view", "payroll.reports.departmentCost.view", "payroll.reports.statutory.view"],
};
export function getRoleName(user) { return user?.roleId?.name || user?.role?.name || user?.role || ""; }
export function hasPermission(user, permission) {
  if (!permission) return true;
  const role = getRoleName(user);
  if (role === "Super Admin") return true;
  const permissions = [...(user?.roleId?.permissions || []), ...(user?.permissions || []), ...(rolePermissions[role] || [])];
  return permissions.some((p) => {
    if (p === "*" || p === "payroll.*") return permission.startsWith("payroll.");
    if (typeof p === "string") return p === permission;
    return p?.code === permission || `${p?.module}.${p?.action}` === permission || (Array.isArray(p?.actions) && p.actions.map((a) => `${p.module}.${a}`).includes(permission));
  });
}
const selfPayrollPermissions = ["payroll.self.view", "payroll.self.payslips.view", "payroll.self.salaryStructure.view", "payroll.self.loans.manage", "payroll.self.tax.manage"];
["Support Staff", "Employee", "Vice Principal", "Subject Coordinator", "Librarian", "Hostel Warden", "Transport Manager", "Exam Coordinator", "Receptionist", "IT Support", "Counselor", "Security"].forEach((role) => {
  rolePermissions[role] = rolePermissions[role] || selfPayrollPermissions;
});
rolePermissions.Management = ["payroll.reports.view", "payroll.audit.view", "payroll.reports.departmentCost.view", "payroll.reports.statutory.view"];

const PayrollPermissionGuard = ({ user, permission, children, fallback = null }) => hasPermission(user, permission) ? <>{children}</> : fallback;
export default PayrollPermissionGuard;
