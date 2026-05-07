import { Router } from "express";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { approveLoan, approvePayroll, createLoanRequest, createTaxConfiguration, generatePayrollRun, getActiveTaxConfiguration, getEmployeeLoans, getPayrollRunDetails, getPayrollRuns, getEnterprisePayslip, downloadEnterprisePayslip, lockPayroll, payrollSummaryReport, rejectLoan } from "../controllers/payrollEnterprise.controllers.js";
const router = Router();
const ADMIN = ["Super Admin", "School Admin", "Accountant"];

router.post("/tax-config", requireRoles(ADMIN), createTaxConfiguration);
router.get("/tax-config", requireRoles(ADMIN), getActiveTaxConfiguration);
router.post("/loan/request", requireRoles(["Employee", ...ADMIN]), createLoanRequest);
router.post("/loan/:id/approve", requireRoles(ADMIN), approveLoan);
router.post("/loan/:id/reject", requireRoles(ADMIN), rejectLoan);
router.get("/loan", requireRoles(["Employee", ...ADMIN]), getEmployeeLoans);
router.post("/run/generate", requireRoles(ADMIN), generatePayrollRun);
router.post("/run/:id/approve", requireRoles(ADMIN), approvePayroll);
router.post("/run/:id/lock", requireRoles(ADMIN), lockPayroll);
router.get("/runs", requireRoles(ADMIN), getPayrollRuns);
router.get("/runs/:id", requireRoles(ADMIN), getPayrollRunDetails);
router.get("/payslip/:payrollItemId", requireRoles(ADMIN), getEnterprisePayslip);
router.get("/payslip/:payrollItemId/download", requireRoles(ADMIN), downloadEnterprisePayslip);
router.get("/reports/summary", requireRoles(ADMIN), payrollSummaryReport);

export default router;
