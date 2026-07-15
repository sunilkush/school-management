import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createAdvance,
  getAdvances,
  getMyAdvances,
  approveAdvance,
  rejectAdvance,
  deductEmi,
  closeAdvance,
} from "../controllers/advance.controllers.js";

const router = Router();

const ADMIN_ROLES = ["Super Admin", "School Admin", "Accountant", "Principal"];
const ALL_STAFF = [
  "Super Admin", "School Admin", "Accountant", "Principal",
  "Teacher", "Employee", "Staff", "Support Staff",
  "Vice Principal", "Librarian", "Hostel Warden",
  "Sports Teacher", "Lab Technician", "Medical Officer", "Class Teacher",
];

router.post("/",              auth, roleMiddleware(ADMIN_ROLES), createAdvance);
router.get("/",               auth, roleMiddleware(ADMIN_ROLES), getAdvances);
router.get("/my",             auth, roleMiddleware(ALL_STAFF),   getMyAdvances);
router.put("/:id/approve",    auth, roleMiddleware(ADMIN_ROLES), approveAdvance);
router.put("/:id/reject",     auth, roleMiddleware(ADMIN_ROLES), rejectAdvance);
router.put("/:id/deduct-emi", auth, roleMiddleware(ADMIN_ROLES), deductEmi);
router.put("/:id/close",      auth, roleMiddleware(ADMIN_ROLES), closeAdvance);

export default router;
