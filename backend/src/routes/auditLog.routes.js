import express from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createAuditLog,
  getAuditFilters,
  getAuditLogs,
} from "../controllers/auditLog.controllers.js";

const router = express.Router();

router.get("/", auth, roleMiddleware(["Super Admin", "School Admin"]), getAuditLogs);
router.get("/filters", auth, roleMiddleware(["Super Admin", "School Admin"]), getAuditFilters);
router.post("/", auth, roleMiddleware(["Super Admin"]), createAuditLog);

export default router;