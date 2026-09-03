import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  deviceAttendanceSummary,
  deviceHeartbeat,
  deleteDevice,
  enrolCredential,
  getUnmatched,
  listCredentials,
  listDevices,
  listPunches,
  receivePunches,
  registerDevice,
  replayPunches,
  revokeCredential,
  rotateDeviceSecret,
  updateDevice,
} from "../controllers/attendanceDevice.controllers.js";

const router = Router();

// Who sets readers up and decides whose card is whose. Deliberately not widened to IT Support:
// enrolling a card needs the staff/student directory (GET /user/all), which that role cannot
// read, so it would get a page where half the workflow silently fails.
const DEVICE_MANAGE = ["Super Admin", "School Admin"];
// Leadership and the attendance desk can look, without being able to change enrolments.
const DEVICE_READ = [...DEVICE_MANAGE, "Principal", "Vice Principal", "Receptionist"];

/* ── Device-facing, unauthenticated ──────────────────────────────────
   A reader on a school's LAN has no account and no session. It identifies itself with its
   device key and proves itself by signing the body with its shared secret, checked inside the
   controller. These two paths must stay in step with PUBLIC_API_ROUTE_PATTERNS in
   middlewares/auth.middleware.js — a path listed here but not there will 401. */
router.post("/punches", receivePunches);
router.post("/heartbeat", deviceHeartbeat);

/* ── Office-facing ───────────────────────────────────────────────── */
router.use(auth);

router.get("/summary", roleMiddleware(DEVICE_READ), deviceAttendanceSummary);

router.get("/", roleMiddleware(DEVICE_READ), listDevices);
router.post("/", roleMiddleware(DEVICE_MANAGE), registerDevice);

/* Literal paths before /:id so they are not captured by it. */
router.get("/credentials", roleMiddleware(DEVICE_READ), listCredentials);
router.post("/credentials", roleMiddleware(DEVICE_MANAGE), enrolCredential);
router.delete("/credentials/:id", roleMiddleware(DEVICE_MANAGE), revokeCredential);

router.get("/logs", roleMiddleware(DEVICE_READ), listPunches);
router.get("/unmatched", roleMiddleware(DEVICE_READ), getUnmatched);
router.post("/replay", roleMiddleware(DEVICE_MANAGE), replayPunches);

router.put("/:id", roleMiddleware(DEVICE_MANAGE), updateDevice);
router.post("/:id/rotate-secret", roleMiddleware(DEVICE_MANAGE), rotateDeviceSecret);
router.delete("/:id", roleMiddleware(DEVICE_MANAGE), deleteDevice);

export default router;
