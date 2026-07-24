import { Router } from "express";
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

const router = Router();

const ADMIN_ROLES = ["Super Admin", "School Admin", "Admin", "Principal", "Vice Principal"];

const SELF_ROLES = [
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
  "Sports Teacher",
  "Lab Technician",
  "Medical Officer",
  "Class Teacher",
  "Driver",
  ...ADMIN_ROLES,
];

router.get("/status",          auth, roleMiddleware(SELF_ROLES), getSelfStatus);
router.post("/check-in",       auth, roleMiddleware(SELF_ROLES), checkIn);
router.post("/check-out",      auth, roleMiddleware(SELF_ROLES), checkOut);
router.get("/history",         auth, roleMiddleware(SELF_ROLES), getSelfHistory);
router.get("/geofence",        auth, roleMiddleware(SELF_ROLES), getGeofenceSettings);
router.put("/geofence",        auth, roleMiddleware(ADMIN_ROLES), updateGeofenceSettings);
router.get("/live-dashboard",  auth, roleMiddleware(ADMIN_ROLES), getLiveDashboard);

export default router;
