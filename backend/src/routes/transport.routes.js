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

// Full manage: Transport Manager + Admins
const TRANSPORT_MANAGE = [
  "Super Admin", "School Admin", "Transport Manager",
];

// Read: leadership + admins can see transport info (for oversight)
const TRANSPORT_READ = [
  ...TRANSPORT_MANAGE,
  "Principal", "Vice Principal", "Accountant",
];

router.get("/vehicles",          auth, roleMiddleware(TRANSPORT_READ),   getVehicles);
router.post("/vehicles",         auth, roleMiddleware(TRANSPORT_MANAGE), createVehicle);
router.put("/vehicles/:id",      auth, roleMiddleware(TRANSPORT_MANAGE), updateVehicle);
router.delete("/vehicles/:id",   auth, roleMiddleware(TRANSPORT_MANAGE), deleteVehicle);

router.get("/routes",            auth, roleMiddleware(TRANSPORT_READ),   getRoutes);
router.post("/routes",           auth, roleMiddleware(TRANSPORT_MANAGE), createRoute);
router.put("/routes/:id",        auth, roleMiddleware(TRANSPORT_MANAGE), updateRoute);
router.delete("/routes/:id",     auth, roleMiddleware(TRANSPORT_MANAGE), deleteRoute);

router.get("/students",          auth, roleMiddleware(TRANSPORT_READ),   getAssignableStudents);
router.get("/assignments",       auth, roleMiddleware(TRANSPORT_READ),   getTransportAssignments);
router.post("/assignments",      auth, roleMiddleware(TRANSPORT_MANAGE), createOrUpdateTransportAssignment);
router.delete("/assignments/:id", auth, roleMiddleware(TRANSPORT_MANAGE), deleteTransportAssignment);

export default router;
