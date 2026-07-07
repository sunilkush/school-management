import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createPayrollStructure,
  getPayrollStructures,
  generatePayrollCycle,
  getLatestPayrollCycle,
  getMonthlyPayrollReport,
  getMyPayrollSummary,
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
const PAYSLIP_SELF_ROLES = ["Super Admin", "School Admin", "Accountant", "Principal", "Admin", "Teacher", "Employee", "Staff", "Support Staff", "Sports Teacher", "Lab Technician", "Medical Officer", "Class Teacher"];
const EMPLOYEE_SELF_ROLES = ["Principal", "School Admin","Accountant", "Teacher", "Employee", "Staff", "Support Staff", "Vice Principal", "Librarian", "Hostel Warden", "Transport Manager", "Exam Coordinator", "Receptionist", "IT Support", "Counselor", "Security", "Sports Teacher", "Lab Technician", "Medical Officer", "Class Teacher"];

router.post("/structure",auth, roleMiddleware(FULL_ACCESS_ROLES), validateRequest(payrollStructureCreateSchema), createPayrollStructure);
router.get("/structure", auth, roleMiddleware(REVIEW_ROLES), getPayrollStructures);


router.post("/cycle/generate", auth, roleMiddleware(FULL_ACCESS_ROLES), validateRequest(payrollCycleGenerateSchema), generatePayrollCycle);
router.get("/self/summary", auth, roleMiddleware(EMPLOYEE_SELF_ROLES), getMyPayrollSummary);
router.get("/reports/monthly", auth, roleMiddleware(REVIEW_ROLES), validateRequest(payrollReportQuerySchema), getMonthlyPayrollReport);
router.put("/structure/:id", auth, roleMiddleware(FULL_ACCESS_ROLES), validateRequest(payrollStructureUpdateSchema), updatePayrollStructure);
router.get("/cycle/latest", auth, roleMiddleware(REVIEW_ROLES), getLatestPayrollCycle);
router.get("/cycle/:month/:year", auth, roleMiddleware(REVIEW_ROLES), validateRequest(payrollCycleQuerySchema), getPayrollCycle);
router.post("/cycle/:id/lock", auth, roleMiddleware(REVIEW_ROLES), validateRequest(payrollCycleActionSchema), lockPayrollCycle);
router.post("/cycle/:id/pay", auth, roleMiddleware(FULL_ACCESS_ROLES), validateRequest(payrollCycleActionSchema), payPayrollCycle);

router.get("/payslip/:employeeId/:month/:year", auth, roleMiddleware(PAYSLIP_SELF_ROLES), validateRequest(payslipQuerySchema), getPayslip);


export default router;
