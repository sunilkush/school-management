import { Router } from "express";
import {
  createManualBackup,
  deleteSystemBackup,
  getSystemBackupById,
  getSystemBackupDownloadUrl,
  getSystemBackupSummary,
  listBackupAuditLogs,
  listSystemBackups,
} from "../controllers/systemBackup.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.get("/summary", getSystemBackupSummary);
router.post("/manual", createManualBackup);
router.get("/", listSystemBackups);
router.get("/audit-logs", listBackupAuditLogs);
router.get("/:id", getSystemBackupById);
router.get("/:id/download", getSystemBackupDownloadUrl);
router.delete("/:id", deleteSystemBackup);

export default router;
