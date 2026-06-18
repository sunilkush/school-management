import express from "express";
import {
  assignStudentToRoom, createHostelRoom, deleteHostelRoom,
  getHostelRooms, removeStudentFromRoom, updateHostelRoom,
} from "../controllers/hostelRoom.controllers.js";
import {
  createLeaveRequest, getAllLeaveRequests, getLeaveById,
  updateLeaveStatus, recordCheckOut, recordCheckIn, deleteLeaveRequest,
} from "../controllers/hostelLeave.controllers.js";
import {
  logVisitorEntry, getAllVisitors, getVisitorById, logVisitorExit, deleteVisitorLog,
} from "../controllers/hostelVisitor.controllers.js";
import {
  createComplaint, getAllComplaints, getComplaintById, updateComplaint, deleteComplaint,
} from "../controllers/hostelComplaint.controllers.js";
import {
  markHostelAttendance, getHostelAttendance,
  getTodayAttendanceSheet, getAttendanceSummary,
} from "../controllers/hostelAttendance.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const WARDEN_ROLES = ["Super Admin", "School Admin", "Hostel Warden"];
const VIEW_ROLES   = ["Super Admin", "School Admin", "Hostel Warden", "Principal", "Vice Principal"];

// ── ROOM MANAGEMENT ────────────────────────────────────────────────────────────
router.get   ("/rooms",                        auth, roleMiddleware(VIEW_ROLES),   getHostelRooms);
router.post  ("/rooms",                        auth, roleMiddleware(WARDEN_ROLES), createHostelRoom);
router.put   ("/rooms/:id",                    auth, roleMiddleware(WARDEN_ROLES), updateHostelRoom);
router.delete("/rooms/:id",                    auth, roleMiddleware(WARDEN_ROLES), deleteHostelRoom);
router.post  ("/rooms/:id/assign",             auth, roleMiddleware(WARDEN_ROLES), assignStudentToRoom);
router.delete("/rooms/:id/students/:studentId",auth, roleMiddleware(WARDEN_ROLES), removeStudentFromRoom);

// ── LEAVE MANAGEMENT ───────────────────────────────────────────────────────────
router.get   ("/leaves",              auth, roleMiddleware(VIEW_ROLES),   getAllLeaveRequests);
router.post  ("/leaves",              auth, roleMiddleware(WARDEN_ROLES), createLeaveRequest);
router.get   ("/leaves/:id",          auth, roleMiddleware(VIEW_ROLES),   getLeaveById);
router.put   ("/leaves/:id/status",   auth, roleMiddleware(WARDEN_ROLES), updateLeaveStatus);
router.put   ("/leaves/:id/checkout", auth, roleMiddleware(WARDEN_ROLES), recordCheckOut);
router.put   ("/leaves/:id/checkin",  auth, roleMiddleware(WARDEN_ROLES), recordCheckIn);
router.delete("/leaves/:id",          auth, roleMiddleware(WARDEN_ROLES), deleteLeaveRequest);

// ── VISITOR MANAGEMENT ─────────────────────────────────────────────────────────
router.get   ("/visitors",          auth, roleMiddleware(VIEW_ROLES),   getAllVisitors);
router.post  ("/visitors",          auth, roleMiddleware(WARDEN_ROLES), logVisitorEntry);
router.get   ("/visitors/:id",      auth, roleMiddleware(VIEW_ROLES),   getVisitorById);
router.put   ("/visitors/:id/exit", auth, roleMiddleware(WARDEN_ROLES), logVisitorExit);
router.delete("/visitors/:id",      auth, roleMiddleware(WARDEN_ROLES), deleteVisitorLog);

// ── COMPLAINT MANAGEMENT ───────────────────────────────────────────────────────
router.get   ("/complaints",      auth, roleMiddleware(VIEW_ROLES),   getAllComplaints);
router.post  ("/complaints",      auth, roleMiddleware(WARDEN_ROLES), createComplaint);
router.get   ("/complaints/:id",  auth, roleMiddleware(VIEW_ROLES),   getComplaintById);
router.put   ("/complaints/:id",  auth, roleMiddleware(WARDEN_ROLES), updateComplaint);
router.delete("/complaints/:id",  auth, roleMiddleware(WARDEN_ROLES), deleteComplaint);

// ── HOSTEL ATTENDANCE ──────────────────────────────────────────────────────────
router.get ("/attendance",         auth, roleMiddleware(VIEW_ROLES),   getHostelAttendance);
router.post("/attendance",         auth, roleMiddleware(WARDEN_ROLES), markHostelAttendance);
router.get ("/attendance/today",   auth, roleMiddleware(VIEW_ROLES),   getTodayAttendanceSheet);
router.get ("/attendance/summary", auth, roleMiddleware(VIEW_ROLES),   getAttendanceSummary);

export default router;
