import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  cancelOnlineClass,
  createOnlineClass,
  getJoins,
  joinOnlineClass,
  listOnlineClasses,
  markAttendanceFromJoins,
  setOnlineClassStatus,
  updateOnlineClass,
} from "../controllers/onlineClass.controllers.js";

const router = Router();

// Who runs a class. Class Teacher and the coordinators are included because they schedule on a
// teacher's behalf in practice.
const HOSTS = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Class Teacher", "Subject Coordinator", "Exam Coordinator",
];
// Everyone who might need to open a link.
const ATTENDEES = [...HOSTS, "Student", "Parent"];

router.use(auth);

router.get("/", roleMiddleware(ATTENDEES), listOnlineClasses);
router.post("/", roleMiddleware(HOSTS), createOnlineClass);

router.post("/:id/join", roleMiddleware(ATTENDEES), joinOnlineClass);
router.get("/:id/joins", roleMiddleware(HOSTS), getJoins);
// Deliberately a separate, explicit action rather than something the join endpoint does on its
// own — see the controller: a link open is not a lesson attended.
router.post("/:id/mark-attendance", roleMiddleware(HOSTS), markAttendanceFromJoins);

router.patch("/:id/status", roleMiddleware(HOSTS), setOnlineClassStatus);
router.patch("/:id", roleMiddleware(HOSTS), updateOnlineClass);
router.delete("/:id", roleMiddleware(HOSTS), cancelOnlineClass);

export default router;
