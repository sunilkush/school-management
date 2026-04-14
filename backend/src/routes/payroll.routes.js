import { Router } from "express";
import { requireRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createPayrollStructure,
  getPayrollStructures,
  generatePayrollCycle,
  getMonthlyPayrollReport,
  getPayrollCycle,
  getPayslip,
  lockPayrollCycle,
  payPayrollCycle,
  updatePayrollStructure,
} from "../controllers/payroll.controllers.js";
import {
  payrollCycleActionSchema,
  payrollCycleGenerateSchema,
  payrollCycleQuerySchema,
  payrollReportQuerySchema,
  payrollStructureCreateSchema,
  payrollStructureUpdateSchema,
  payslipQuerySchema,
} from "../validators/payroll.validator.js";

const router = Router();

const FULL_ACCESS_ROLES = ["Super Admin", "School Admin", "Accountant"];
const REVIEW_ROLES = ["Super Admin", "School Admin", "Accountant", "Principal", "Admin"];
const PAYSLIP_SELF_ROLES = ["Super Admin", "School Admin", "Accountant", "Principal", "Admin", "Teacher", "Employee"];

router.post("/structure", requireRoles(FULL_ACCESS_ROLES), validateRequest(payrollStructureCreateSchema), createPayrollStructure);
router.get("/structure", requireRoles(REVIEW_ROLES), getPayrollStructures);
router.put("/structure/:id", requireRoles(FULL_ACCESS_ROLES), validateRequest(payrollStructureUpdateSchema), updatePayrollStructure);

router.post("/cycle/generate", requireRoles(FULL_ACCESS_ROLES), validateRequest(payrollCycleGenerateSchema), generatePayrollCycle);
router.get("/cycle/:month/:year", requireRoles(REVIEW_ROLES), validateRequest(payrollCycleQuerySchema), getPayrollCycle);
router.post("/cycle/:id/lock", requireRoles(REVIEW_ROLES), validateRequest(payrollCycleActionSchema), lockPayrollCycle);
router.post("/cycle/:id/pay", requireRoles(FULL_ACCESS_ROLES), validateRequest(payrollCycleActionSchema), payPayrollCycle);
router.get("/payslip/:employeeId/:month/:year", requireRoles(PAYSLIP_SELF_ROLES), validateRequest(payslipQuerySchema), getPayslip);
router.get("/reports/monthly", requireRoles(REVIEW_ROLES), validateRequest(payrollReportQuerySchema), getMonthlyPayrollReport);

export default router;
