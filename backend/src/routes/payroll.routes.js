import express from "express";
import {
  activateStructure,
  approveCycle,
  createComponent,
  createCycle,
  createLoan,
  createReimbursement,
  createStructure,
  deleteComponent,
  downloadPayslip,
  exportReport,
  generatePayslips,
  getCycle,
  getEmployeePayroll,
  getSettings,
  listComponents,
  listCycles,
  listEmployees,
  listLoans,
  listPayslips,
  listReimbursements,
  listStructures,
  lockCycle,
  markCyclePaid,
  myPayslips,
  processCycle,
  rejectCycle,
  saveEmployeeProfile,
  summaryReport,
  updateComponent,
  updateReimbursementStatus,
  updateSettings,
  updateStructure,
  upsertSettings,
} from "../controllers/payroll.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const payrollUsers = ["Super Admin", "School Admin", "Principal", "Accountant", "HR", "Teacher", "Staff", "Support Staff", "Employee"];
const payrollAdmins = ["Super Admin", "School Admin", "Principal", "Accountant", "HR"];

router.use(auth, roleMiddleware(payrollUsers));

router.get("/settings", roleMiddleware(payrollAdmins), getSettings);
router.post("/settings", roleMiddleware(payrollAdmins), upsertSettings);
router.put("/settings/:id", roleMiddleware(payrollAdmins), updateSettings);

router.get("/components", roleMiddleware(payrollAdmins), listComponents);
router.post("/components", roleMiddleware(payrollAdmins), createComponent);
router.put("/components/:id", roleMiddleware(payrollAdmins), updateComponent);
router.delete("/components/:id", roleMiddleware(payrollAdmins), deleteComponent);

router.get("/employees", roleMiddleware(payrollAdmins), listEmployees);
router.get("/employees/:employeeId", getEmployeePayroll);
router.post("/employees/:employeeId/profile", roleMiddleware(payrollAdmins), saveEmployeeProfile);
router.put("/employees/:employeeId/profile", roleMiddleware(payrollAdmins), saveEmployeeProfile);

router.get("/structures", roleMiddleware(payrollAdmins), listStructures);
router.post("/structures", roleMiddleware(payrollAdmins), createStructure);
router.put("/structures/:id", roleMiddleware(payrollAdmins), updateStructure);
router.patch("/structures/:id/activate", roleMiddleware(payrollAdmins), activateStructure);

router.get("/cycles", roleMiddleware(payrollAdmins), listCycles);
router.post("/cycles", roleMiddleware(payrollAdmins), createCycle);
router.get("/cycles/:id", roleMiddleware(payrollAdmins), getCycle);
router.patch("/cycles/:id/process", roleMiddleware(payrollAdmins), processCycle);
router.patch("/cycles/:id/approve", roleMiddleware(payrollAdmins), approveCycle);
router.patch("/cycles/:id/reject", roleMiddleware(payrollAdmins), rejectCycle);
router.patch("/cycles/:id/mark-paid", roleMiddleware(payrollAdmins), markCyclePaid);
router.patch("/cycles/:id/lock", roleMiddleware(payrollAdmins), lockCycle);
router.post("/cycles/:id/generate-payslips", roleMiddleware(payrollAdmins), generatePayslips);

router.get("/payslips", roleMiddleware(payrollAdmins), listPayslips);
router.get("/payslips/my", myPayslips);
router.get("/payslips/:runItemId/download", downloadPayslip);

router.get("/reports/summary", roleMiddleware(payrollAdmins), summaryReport);
router.get("/reports/bank-export", roleMiddleware(payrollAdmins), exportReport("bank-export"));
router.get("/reports/pf", roleMiddleware(payrollAdmins), exportReport("pf"));
router.get("/reports/esi", roleMiddleware(payrollAdmins), exportReport("esi"));
router.get("/reports/tds", roleMiddleware(payrollAdmins), exportReport("tds"));
router.get("/reports/professional-tax", roleMiddleware(payrollAdmins), exportReport("professional-tax"));

router.get("/loans", listLoans);
router.post("/loans", roleMiddleware(payrollAdmins), createLoan);

router.get("/reimbursements", listReimbursements);
router.post("/reimbursements", createReimbursement);
router.patch("/reimbursements/:id/status", roleMiddleware(payrollAdmins), updateReimbursementStatus);

export default router;
