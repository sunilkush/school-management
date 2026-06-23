import { Router } from "express";
import {
  createLoginLog,
  getLoginLogsByUser,
  getLoginLogsBySchool,
  getLoginLogsByAcademicYear,
  getLoginLogs,
  setLogoutTime,
  getLoginStats,
} from "../controllers/loginLog.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const ADMIN_ROLE = ["Super Admin", "School Admin"];
const ALL_USERS = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
  "Student", "Parent",
  "Accountant", "Staff", "Support Staff",
  "Librarian", "Hostel Warden", "Transport Manager",
  "Receptionist", "IT Support", "Counselor", "Security",
];

router.use(auth);

router.post("/",                             roleMiddleware(ALL_USERS),  createLoginLog);
router.get("/user/:userId",                  roleMiddleware(ALL_USERS),  getLoginLogsByUser);
router.put("/:id/logout",                    roleMiddleware(ALL_USERS),  setLogoutTime);
router.get("/stats",                         roleMiddleware(ADMIN_ROLE), getLoginStats);
router.get("/school/:schoolId",              roleMiddleware(ADMIN_ROLE), getLoginLogsBySchool);
router.get("/academic-year/:academicYearId", roleMiddleware(ADMIN_ROLE), getLoginLogsByAcademicYear);
router.get("/",                              roleMiddleware(ADMIN_ROLE), getLoginLogs);

export default router;
