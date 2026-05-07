import { Router } from "express";
import { requireRoles } from "../middlewares/auth.middleware.js";
import {
  approveLoan,
  approvePayroll,
  approveReimbursement,
  createBonusIncentive,
  createLoanRequest,
  createReimbursement,
  createTaxConfiguration,
  generateBankTransfer,
  generatePayrollRun,
  getActiveTaxConfiguration,
  getComplianceFilings,
  getEmployeeLoans,
  getPayrollRunDetails,
  getPayrollRuns,
  getReimbursements,
  lockPayroll,
  markPayrollPaid,
  payrollSummaryReport,
  rejectLoan,
  rollbackPayroll,
  upsertComplianceFiling,
} from "../controllers/payrollEnterprise.controllers.js";

const router = Router();
const ADMIN = ["Super Admin", "School Admin", "Accountant"];
const APPROVERS = ["Super Admin", "School Admin", "HR", "Accountant", "Principal", "Admin"];
const EMPLOYEE_SELF = ["Employee", "Teacher", "Staff", "Support Staff", "Principal", "Admin", "Vice Principal", "Librarian"];

router.post("/tax-config", requireRoles(ADMIN), createTaxConfiguration);
router.get("/tax-config", requireRoles(ADMIN), getActiveTaxConfiguration);
router.post("/loan/request", requireRoles([...EMPLOYEE_SELF, ...ADMIN]), createLoanRequest);
router.post("/loan/:id/approve", requireRoles(ADMIN), approveLoan);
router.post("/loan/:id/reject", requireRoles(ADMIN), rejectLoan);
router.get("/loan", requireRoles([...EMPLOYEE_SELF, ...ADMIN]), getEmployeeLoans);
router.post("/bonus", requireRoles(ADMIN), createBonusIncentive);
router.post("/reimbursements", requireRoles([...EMPLOYEE_SELF, ...ADMIN]), createReimbursement);
router.post("/reimbursements/:id/approve", requireRoles(APPROVERS), approveReimbursement);
router.get("/reimbursements", requireRoles([...EMPLOYEE_SELF, ...ADMIN]), getReimbursements);
router.post("/run/generate", requireRoles(ADMIN), generatePayrollRun);
router.post("/run/:id/approve", requireRoles(APPROVERS), approvePayroll);
router.post("/run/:id/pay", requireRoles(ADMIN), markPayrollPaid);
router.post("/run/:id/lock", requireRoles(ADMIN), lockPayroll);
router.post("/run/:id/rollback", requireRoles(ADMIN), rollbackPayroll);
router.post("/run/:id/bank-transfer", requireRoles(ADMIN), generateBankTransfer);
router.get("/runs", requireRoles(APPROVERS), getPayrollRuns);
router.get("/runs/:id", requireRoles(APPROVERS), getPayrollRunDetails);
router.post("/compliance", requireRoles(ADMIN), upsertComplianceFiling);
router.get("/compliance", requireRoles(ADMIN), getComplianceFilings);
router.get("/reports/summary", requireRoles(APPROVERS), payrollSummaryReport);

export default router;
