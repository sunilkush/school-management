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
  getMyVehicles,
  getRoutes,
  getTransportAssignments,
  getVehicles,
  updateRoute,
  updateVehicle,
} from "../controllers/transport.controllers.js";
import {
  endTrip,
  getLiveTrips,
  getMyBus,
  getMyTrip,
  getTripTrail,
  listTrips,
  pingTrip,
  startTrip,
} from "../controllers/transportTracking.controllers.js";

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

router.get("/vehicles/my",       auth, roleMiddleware(["Driver"]),       getMyVehicles);
router.get("/vehicles",          auth, roleMiddleware(TRANSPORT_READ),   getVehicles);
router.post("/vehicles",         auth, roleMiddleware(TRANSPORT_MANAGE), createVehicle);
router.put("/vehicles/:id",      auth, roleMiddleware(TRANSPORT_MANAGE), updateVehicle);
router.delete("/vehicles/:id",   auth, roleMiddleware(TRANSPORT_MANAGE), deleteVehicle);

// Drivers are included here and nowhere else in this file: a driver has to pick which route they
// are running, and a list of route names and stops carries nothing about any student.
router.get("/routes",            auth, roleMiddleware([...TRANSPORT_READ, "Driver"]), getRoutes);
router.post("/routes",           auth, roleMiddleware(TRANSPORT_MANAGE), createRoute);
router.put("/routes/:id",        auth, roleMiddleware(TRANSPORT_MANAGE), updateRoute);
router.delete("/routes/:id",     auth, roleMiddleware(TRANSPORT_MANAGE), deleteRoute);

router.get("/students",          auth, roleMiddleware(TRANSPORT_READ),   getAssignableStudents);
router.get("/assignments",       auth, roleMiddleware(TRANSPORT_READ),   getTransportAssignments);
router.post("/assignments",      auth, roleMiddleware(TRANSPORT_MANAGE), createOrUpdateTransportAssignment);
router.delete("/assignments/:id", auth, roleMiddleware(TRANSPORT_MANAGE), deleteTransportAssignment);

/* ── Live tracking ───────────────────────────────────────────────────
   A driver runs the trip; the office watches it; a parent sees only their own child's bus.
   Literal paths are declared before /trips/:id so they are not captured by it. */
const TRIP_RUNNERS = [...TRANSPORT_MANAGE, "Driver"];
const BUS_WATCHERS = ["Parent", "Student"];

router.get("/trips/live",      auth, roleMiddleware(TRANSPORT_READ),  getLiveTrips);
router.get("/trips/mine",      auth, roleMiddleware(TRIP_RUNNERS),     getMyTrip);
router.get("/trips/my-bus",    auth, roleMiddleware(BUS_WATCHERS),    getMyBus);
router.get("/trips",           auth, roleMiddleware(TRANSPORT_READ),  listTrips);
router.post("/trips",          auth, roleMiddleware(TRIP_RUNNERS),    startTrip);
router.get("/trips/:id",       auth, roleMiddleware(TRANSPORT_READ),  getTripTrail);
router.post("/trips/:id/ping", auth, roleMiddleware(TRIP_RUNNERS),    pingTrip);
router.post("/trips/:id/end",  auth, roleMiddleware(TRIP_RUNNERS),    endTrip);

export default router;
