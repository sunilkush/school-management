import { Router } from "express";
import { requireRoles } from "../../../middlewares/auth.middleware.js";
import {
  approvePayrollRun,
  approveSalaryStructure,
  auditLogs,
  bankExportReport,
  calculatePayrollRun,
  createEmployeeLoan,
  createPayrollCycle,
  createSalaryComponent,
  createSalaryStructure,
  deleteSalaryComponent,
  departmentCostReport,
  downloadPayslip,
  employeeLedgerReport,
  generatePayslips,
  getEmployeeSalaryStructure,
  getPayrollCycle,
  getMyPayrollSummary,
  getPayrollSettings,
  listEmployeeLoans,
  listPayrollCycles,
  listPayrollRunItems,
  listPayslips,
  listSalaryComponents,
  listSalaryStructures,
  listTaxDeclarations,
  listMyPayslips,
  lockPayrollCycle,
  markPayrollPaid,
  payrollSummaryReport,
  publishPayslips,
  statutoryReport,
  updatePayrollCycle,
  updatePayrollRunItem,
  updatePayrollSettings,
  updateSalaryComponent,
  updateSalaryStructure,
  upsertPayrollSettings,
  upsertTaxDeclaration,
} from "../controllers/payroll.controller.js";

const router = Router();
const FULL = ["Super Admin", "School Admin"];
const SETTINGS = ["Super Admin", "School Admin"];
const STRUCTURE = ["Super Admin", "School Admin", "HR"];
const PROCESS = ["Super Admin", "School Admin", "Accountant"];
const APPROVE = ["Super Admin", "School Admin", "Principal"];
const REPORTS = ["Super Admin", "School Admin", "Principal", "Accountant", "Auditor", "Management"];
const SELF = ["Teacher", "Staff", "Support Staff", "Employee", "Principal", "Accountant", "HR", "Vice Principal", "Subject Coordinator", "Librarian", "Hostel Warden", "Transport Manager", "Exam Coordinator", "Receptionist", "IT Support", "Counselor", "Security"];

router.post("/settings", requireRoles(SETTINGS), upsertPayrollSettings);
router.get("/settings", requireRoles([...SETTINGS, "Principal", "Accountant", "Auditor"]), getPayrollSettings);
router.patch("/settings/:id", requireRoles(SETTINGS), updatePayrollSettings);

router.post("/components", requireRoles(SETTINGS), createSalaryComponent);
router.get("/components", requireRoles([...SETTINGS, ...STRUCTURE, "Accountant"]), listSalaryComponents);
router.patch("/components/:id", requireRoles(SETTINGS), updateSalaryComponent);
router.delete("/components/:id", requireRoles(SETTINGS), deleteSalaryComponent);

router.post("/salary-structures", requireRoles(STRUCTURE), createSalaryStructure);
router.get("/salary-structures", requireRoles([...STRUCTURE, "Principal", "Accountant"]), listSalaryStructures);
router.get("/salary-structures/employee/:employeeId", requireRoles([...STRUCTURE, ...SELF]), getEmployeeSalaryStructure);
router.patch("/salary-structures/:id", requireRoles(STRUCTURE), updateSalaryStructure);
router.post("/salary-structures/:id/approve", requireRoles([...FULL, "Principal"]), approveSalaryStructure);

router.post("/cycles", requireRoles(PROCESS), createPayrollCycle);
router.get("/cycles", requireRoles([...PROCESS, ...APPROVE, ...REPORTS]), listPayrollCycles);
router.get("/cycles/:id", requireRoles([...PROCESS, ...APPROVE, ...REPORTS]), getPayrollCycle);
router.patch("/cycles/:id", requireRoles(PROCESS), updatePayrollCycle);
router.post("/cycles/:id/lock", requireRoles(FULL), lockPayrollCycle);

router.post("/runs/:cycleId/calculate", requireRoles(PROCESS), calculatePayrollRun);
router.get("/runs/:cycleId/items", requireRoles([...PROCESS, ...APPROVE]), listPayrollRunItems);
router.patch("/runs/items/:itemId", requireRoles(PROCESS), updatePayrollRunItem);
router.post("/runs/:cycleId/approve", requireRoles(APPROVE), approvePayrollRun);
router.post("/runs/:cycleId/mark-paid", requireRoles(PROCESS), markPayrollPaid);

router.post("/payslips/:cycleId/generate", requireRoles(PROCESS), generatePayslips);
router.post("/payslips/:cycleId/publish", requireRoles([...FULL, "Accountant"]), publishPayslips);
router.get("/payslips", requireRoles([...PROCESS, ...APPROVE, "HR"]), listPayslips);
router.get("/payslips/my", requireRoles(SELF), listMyPayslips);
router.get("/self/summary", requireRoles(SELF), getMyPayrollSummary);
router.get("/payslips/:id/download", requireRoles([...PROCESS, ...APPROVE, ...SELF]), downloadPayslip);

router.get("/loans", requireRoles([...STRUCTURE, ...SELF, ...PROCESS]), listEmployeeLoans);
router.post("/loans", requireRoles([...STRUCTURE, ...SELF]), createEmployeeLoan);
router.get("/tax-declarations", requireRoles([...STRUCTURE, ...SELF, ...PROCESS]), listTaxDeclarations);
router.post("/tax-declarations", requireRoles([...STRUCTURE, ...SELF]), upsertTaxDeclaration);

router.get("/reports/summary", requireRoles(REPORTS), payrollSummaryReport);
router.get("/reports/department-cost", requireRoles(REPORTS), departmentCostReport);
router.get("/reports/statutory", requireRoles(REPORTS), statutoryReport);
router.get("/reports/bank-export", requireRoles([...REPORTS, "Accountant"]), bankExportReport);
router.get("/reports/employee-ledger/:employeeId", requireRoles([...REPORTS, "HR"]), employeeLedgerReport);
router.get("/audit-logs", requireRoles([...REPORTS, "Auditor"]), auditLogs);

export default router;
