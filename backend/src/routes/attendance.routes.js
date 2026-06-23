import { Router } from "express";
import {
  deleteAttendance,
  getAttendance,
  getMonthlyReport,
  getMyAttendance,
  markBulkAttendance,
  updateAttendance,
} from "../controllers/attendance.controllers.js";
import {
  getSelfStatus,
  checkIn,
  checkOut,
  getSelfHistory,
  getGeofenceSettings,
  updateGeofenceSettings,
  getLiveDashboard,
} from "../controllers/selfAttendance.controllers.js";
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

const ADMIN_ATTENDANCE_ROLES = [
  "Super Admin",
  "School Admin",
  "Admin",
  "Principal",
  "Vice Principal",
];

const STUDENT_ATTENDANCE_MARKERS = [
  ...ADMIN_ATTENDANCE_ROLES,
  "Teacher",
  "Hostel Warden",
];

const STAFF_ATTENDANCE_MARKERS = [
  ...ADMIN_ATTENDANCE_ROLES,
  "Accountant",
];

const SELF_ATTENDANCE_ROLES = [
  "Teacher",
  "Staff",
  "Support Staff",
  "Subject Coordinator",
  "Librarian",
  "Hostel Warden",
  "Transport Manager",
  "Exam Coordinator",
  "Receptionist",
  "IT Support",
  "Counselor",
  "Security",
  "Accountant",
];

const REPORT_ROLES = [
  ...ADMIN_ATTENDANCE_ROLES,
  "Teacher",
  "Accountant",
  "Hostel Warden",
];

const MANAGE_ROLES = Array.from(new Set([
  ...STUDENT_ATTENDANCE_MARKERS,
  ...STAFF_ATTENDANCE_MARKERS,
  ...SELF_ATTENDANCE_ROLES,
]));

const VIEW_ROLES = Array.from(new Set([
  ...REPORT_ROLES,
  "Staff",
  "Support Staff",
  "Librarian",
  "Transport Manager",
  "Exam Coordinator",
  "Receptionist",
  "IT Support",
  "Counselor",
  "Security",
]));

const MY_ATTENDANCE_ROLES = [
  ...VIEW_ROLES,
  "Student",
  "Parent",
  "Subject Coordinator",
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

/* ── GPS Self-Attendance routes — must be before /:id to avoid route capture ── */
const GEOFENCE_ADMIN_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Admin"];

router.get("/self/status",         auth, roleMiddleware(SELF_ATTENDANCE_ROLES), getSelfStatus);
router.post("/self/check-in",      auth, roleMiddleware(SELF_ATTENDANCE_ROLES), checkIn);
router.post("/self/check-out",     auth, roleMiddleware(SELF_ATTENDANCE_ROLES), checkOut);
router.get("/self/history",        auth, roleMiddleware(SELF_ATTENDANCE_ROLES), getSelfHistory);
router.get("/self/geofence",       auth, roleMiddleware(SELF_ATTENDANCE_ROLES), getGeofenceSettings);
router.put("/self/geofence",       auth, roleMiddleware(GEOFENCE_ADMIN_ROLES),  updateGeofenceSettings);
router.get("/self/live-dashboard", auth, roleMiddleware(GEOFENCE_ADMIN_ROLES),  getLiveDashboard);

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
