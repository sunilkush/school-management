import express from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createOrUpdateTransportAssignment,
  createRoute,
  createVehicle,
  deleteRoute,
  deleteTransportAssignment,
  deleteVehicle,
  getAssignableStudents,
  getRoutes,
  getTransportAssignments,
  getVehicles,
  updateRoute,
  updateVehicle,
} from "../controllers/transport.controllers.js";

const router = express.Router();

const ALLOWED_ROLES = ["Super Admin", "School Admin", "Transport Manager"];

router.get("/vehicles", auth, roleMiddleware(ALLOWED_ROLES), getVehicles);
router.post("/vehicles", auth, roleMiddleware(ALLOWED_ROLES), createVehicle);
router.put("/vehicles/:id", auth, roleMiddleware(ALLOWED_ROLES), updateVehicle);
router.delete("/vehicles/:id", auth, roleMiddleware(ALLOWED_ROLES), deleteVehicle);

router.get("/routes", auth, roleMiddleware(ALLOWED_ROLES), getRoutes);
router.post("/routes", auth, roleMiddleware(ALLOWED_ROLES), createRoute);
router.put("/routes/:id", auth, roleMiddleware(ALLOWED_ROLES), updateRoute);
router.delete("/routes/:id", auth, roleMiddleware(ALLOWED_ROLES), deleteRoute);

router.get("/students", auth, roleMiddleware(ALLOWED_ROLES), getAssignableStudents);
router.get("/assignments", auth, roleMiddleware(ALLOWED_ROLES), getTransportAssignments);
router.post("/assignments", auth, roleMiddleware(ALLOWED_ROLES), createOrUpdateTransportAssignment);
router.delete("/assignments/:id", auth, roleMiddleware(ALLOWED_ROLES), deleteTransportAssignment);

export default router;
