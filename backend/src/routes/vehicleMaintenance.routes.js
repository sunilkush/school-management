import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createMaintenance, getMaintenanceRecords, updateMaintenance, deleteMaintenance, getMaintenanceStats,
} from "../controllers/vehicleMaintenance.controllers.js";

const router = Router();
router.use(auth);

const ALLOWED = ["School Admin", "Transport Manager", "Super Admin"];

router.get   ("/stats", roleMiddleware(ALLOWED), getMaintenanceStats);
router.get   ("/",      roleMiddleware(ALLOWED), getMaintenanceRecords);
router.post  ("/",      roleMiddleware(ALLOWED), createMaintenance);
router.put   ("/:id",   roleMiddleware(ALLOWED), updateMaintenance);
router.delete("/:id",   roleMiddleware(ALLOWED), deleteMaintenance);

export default router;
