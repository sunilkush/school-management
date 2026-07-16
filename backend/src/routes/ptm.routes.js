import express from "express";
import {
  createSession, getSessions, getSessionSlots, cancelSession, markAttendance,
  getAvailableSlots, bookSlot, cancelBooking, getMyBookings,
} from "../controllers/ptm.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const PTM_STAFF_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher", "Class Teacher"];
const PTM_PARENT_ROLES = ["Super Admin", "School Admin", "Parent"];

// ── Staff: Sessions ──
router.post(
  "/sessions",
  auth, roleMiddleware(PTM_STAFF_ROLES),
  validate({
    body: {
      title: { required: true, type: "string" },
      schoolClassId: { required: true, type: "objectId" },
      sectionId: { required: true, type: "objectId" },
      startTime: { required: true, validate: (v) => !Number.isNaN(new Date(v).getTime()), message: "body.startTime must be a valid date" },
      endTime: { required: true, validate: (v) => !Number.isNaN(new Date(v).getTime()), message: "body.endTime must be a valid date" },
    },
  }),
  createSession
);
router.get("/sessions", auth, roleMiddleware(PTM_STAFF_ROLES), getSessions);
router.get(
  "/sessions/:id/slots",
  auth, roleMiddleware(PTM_STAFF_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getSessionSlots
);
router.patch(
  "/sessions/:id/cancel",
  auth, roleMiddleware(PTM_STAFF_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  cancelSession
);
router.patch(
  "/slots/:id/attendance",
  auth, roleMiddleware(PTM_STAFF_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  markAttendance
);

// ── Parent: Booking ──
router.get("/slots/available", auth, roleMiddleware(PTM_PARENT_ROLES), getAvailableSlots);
router.get("/slots/my-bookings", auth, roleMiddleware(PTM_PARENT_ROLES), getMyBookings);
router.post(
  "/slots/:id/book",
  auth, roleMiddleware(PTM_PARENT_ROLES),
  validate({
    params: { id: { required: true, type: "objectId" } },
    body: { studentId: { required: true, type: "objectId" } },
  }),
  bookSlot
);
router.patch(
  "/slots/:id/cancel-booking",
  auth, roleMiddleware(PTM_PARENT_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  cancelBooking
);

export default router;
