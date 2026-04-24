import { Router } from "express";
import {
  createBackupSchedule,
  deleteBackupSchedule,
  listBackupSchedules,
  updateBackupSchedule,
} from "../controllers/systemBackup.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/", createBackupSchedule);
router.get("/", listBackupSchedules);
router.patch("/:id", updateBackupSchedule);
router.delete("/:id", deleteBackupSchedule);

export default router;
