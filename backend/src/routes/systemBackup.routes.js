import { Router } from "express";
import {
  createManualBackup,
  deleteSystemBackup,
  downloadBackupFile,
  getSystemBackupById,
  getSystemBackupSummary,
  listBackupAuditLogs,
  listSystemBackups,
} from "../controllers/systemBackup.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const SUPER_ADMIN = ["Super Admin"];

router.use(auth);
router.use(roleMiddleware(SUPER_ADMIN));

router.get("/summary",        getSystemBackupSummary);
router.post("/manual",        createManualBackup);
router.get("/",               listSystemBackups);
router.get("/audit-logs",     listBackupAuditLogs);
router.get("/:id",            getSystemBackupById);
router.get("/:id/download",   downloadBackupFile);
router.delete("/:id",         deleteSystemBackup);

export default router;
