import { Router } from "express";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { approveLoan, approvePayroll, createLoanRequest, createTaxConfiguration, generatePayrollRun, getEmployeeLoans, getPayrollRuns, lockPayroll, payrollSummaryReport } from "../controllers/payrollEnterprise.controllers.js";

const router = Router();
const ADMIN = ["Super Admin", "School Admin", "Accountant"];

router.post("/tax-config", requireRoles(ADMIN), createTaxConfiguration);
router.post("/loan/request", requireRoles(["Employee", ...ADMIN]), createLoanRequest);
router.post("/loan/:id/approve", requireRoles(ADMIN), approveLoan);
router.get("/loan", requireRoles(["Employee", ...ADMIN]), getEmployeeLoans);
router.post("/run/generate", requireRoles(ADMIN), generatePayrollRun);
router.post("/run/:id/approve", requireRoles(ADMIN), approvePayroll);
router.post("/run/:id/lock", requireRoles(ADMIN), lockPayroll);
router.get("/runs", requireRoles(ADMIN), getPayrollRuns);
router.get("/reports/summary", requireRoles(ADMIN), payrollSummaryReport);

export default router;
