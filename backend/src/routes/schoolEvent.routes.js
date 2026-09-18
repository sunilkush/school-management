import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createSchoolEvent,
  deleteSchoolEvent,
  getSchoolEvent,
  listSchoolEvents,
  schoolEventStats,
  updateSchoolEvent,
} from "../controllers/schoolEvent.controllers.js";

const router = Router();

// Everyone in the school reads the calendar; only the people who run it may change it. Writing was
// open to every signed-in user, so a student or a driver could delete the school's events.
const CALENDAR_EDITORS = ["Super Admin", "School Admin", "Principal", "Vice Principal"];

router.get("/", auth, listSchoolEvents);
router.get("/stats", auth, schoolEventStats);
router.get("/:id", auth, getSchoolEvent);
router.post("/", auth, roleMiddleware(CALENDAR_EDITORS), createSchoolEvent);
router.put("/:id", auth, roleMiddleware(CALENDAR_EDITORS), updateSchoolEvent);
router.delete("/:id", auth, roleMiddleware(CALENDAR_EDITORS), deleteSchoolEvent);

export default router;
