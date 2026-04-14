import { Router } from "express";
import {
  deleteAttendance,
  getAttendance,
  getMonthlyReport,
  getMyAttendance,
  markBulkAttendance,
  updateAttendance,
} from "../controllers/attendance.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  attendanceIdParamSchema,
  attendanceListQuerySchema,
  markBulkAttendanceSchema,
  monthlyReportQuerySchema,
  myAttendanceQuerySchema,
  updateAttendanceSchema,
} from "../validators/attendance.validator.js";

const router = Router();

const REPORT_ROLES = [
  "Super Admin",
  "School Admin",
  "Admin",
  "Principal",
  "Vice Principal",
  "Teacher",
];

const MANAGE_ROLES = [
  ...REPORT_ROLES,
  "Staff",
  "Support Staff",
];

const VIEW_ROLES = [
  ...MANAGE_ROLES,
  "Accountant",
];

const MY_ATTENDANCE_ROLES = [
  ...MANAGE_ROLES,
  "Student",
  "Parent",
  "Accountant",
];

router.post(
  "/mark-bulk",
  auth,
  roleMiddleware(MANAGE_ROLES),
  validateRequest(markBulkAttendanceSchema),
  markBulkAttendance
);

router.get(
  "/",
  auth,
  roleMiddleware(VIEW_ROLES),
  validateRequest(attendanceListQuerySchema),
  getAttendance
);

router.get(
  "/report/monthly",
  auth,
  roleMiddleware(REPORT_ROLES),
  validateRequest(monthlyReportQuerySchema),
  getMonthlyReport
);

router.get(
  "/my",
  auth,
  roleMiddleware(MY_ATTENDANCE_ROLES),
  validateRequest(myAttendanceQuerySchema),
  getMyAttendance
);

router.put(
  "/:id",
  auth,
  roleMiddleware(MANAGE_ROLES),
  validateRequest(updateAttendanceSchema),
  updateAttendance
);

router.delete(
  "/:id",
  auth,
  roleMiddleware(MANAGE_ROLES),
  validateRequest(attendanceIdParamSchema),
  deleteAttendance
);

export default router;
