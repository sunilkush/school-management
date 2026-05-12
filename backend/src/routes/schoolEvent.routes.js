import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  createSchoolEvent,
  deleteSchoolEvent,
  getSchoolEvent,
  listSchoolEvents,
  schoolEventStats,
  updateSchoolEvent,
} from "../controllers/schoolEvent.controllers.js";

const router = Router();

router.get("/", auth, listSchoolEvents);
router.get("/stats", auth, schoolEventStats);
router.get("/:id", auth, getSchoolEvent);
router.post("/", auth, createSchoolEvent);
router.put("/:id", auth, updateSchoolEvent);
router.delete("/:id", auth, deleteSchoolEvent);

export default router;
