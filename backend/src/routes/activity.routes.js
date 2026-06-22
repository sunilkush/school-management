// routes/activityRoutes.js
import express from "express";
import {
  createActivityLog,
  getActivityLogs,
  deleteActivityLog,
} from "../controllers/activity.controllers.js";
import { auth, roleMiddleware} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public: create logs (optional, can be used by system)
router.post("/", auth, createActivityLog);

// Super Admin / Admin / IT Support: get logs
router.get("/", auth, roleMiddleware(["Super Admin", "School Admin", "IT Support", "Principal"]), getActivityLogs);

// Super Admin: delete a log
router.delete("/:id", auth, roleMiddleware(["Super Admin"]), deleteActivityLog);

export default router;
