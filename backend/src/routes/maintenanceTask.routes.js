import express from "express";
import {
  listMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
} from "../controllers/maintenanceTask.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const ALLOWED = ["IT Support", "School Admin", "Super Admin", "Principal"];

router.use(auth, roleMiddleware(ALLOWED));

router.get("/", listMaintenanceTasks);
router.post("/", createMaintenanceTask);
router.patch("/:id", updateMaintenanceTask);
router.delete("/:id", deleteMaintenanceTask);

export default router;
