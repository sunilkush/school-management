import { Router } from "express";
import {
  createBackupSchedule,
  deleteBackupSchedule,
  listBackupSchedules,
  updateBackupSchedule,
} from "../controllers/systemBackup.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const SUPER_ADMIN = ["Super Admin"];

router.use(auth);
router.use(roleMiddleware(SUPER_ADMIN));

router.post("/",    createBackupSchedule);
router.get("/",     listBackupSchedules);
router.patch("/:id", updateBackupSchedule);
router.delete("/:id", deleteBackupSchedule);

export default router;
