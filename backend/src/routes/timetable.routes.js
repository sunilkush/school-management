import { Router } from "express";
import {
  bulkSaveTimetable,
  childTimetable,
  classSectionTimetable,
  copyWeekTimetable,
  createRoom,
  createTimeSlot,
  createTimetableEntry,
  deleteRoom,
  deleteTimeSlot,
  deleteTimetableEntry,
  listRooms,
  listTimeSlots,
  listTimetable,
  myStudentTimetable,
  myTeacherTimetable,
  updateRoom,
  updateTimeSlot,
  updateTimetableEntry,
} from "../controllers/timetable.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

// Who can create/edit the master timetable
const TIMETABLE_MANAGE = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
];

// Who can view timetables (broad: all school members)
const TIMETABLE_READ = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
  "Student", "Parent", "Accountant",
  "Librarian", "Hostel Warden", "Transport Manager", "Receptionist",
];

// Time slots (master config) — admin manage, all read
router.get("/time-slots",        roleMiddleware(TIMETABLE_READ),   listTimeSlots);
router.post("/time-slots",       roleMiddleware(TIMETABLE_MANAGE), createTimeSlot);
router.put("/time-slots/:id",    roleMiddleware(TIMETABLE_MANAGE), updateTimeSlot);
router.delete("/time-slots/:id", roleMiddleware(TIMETABLE_MANAGE), deleteTimeSlot);

// Rooms
router.get("/rooms",        roleMiddleware(TIMETABLE_READ),   listRooms);
router.post("/rooms",       roleMiddleware(TIMETABLE_MANAGE), createRoom);
router.put("/rooms/:id",    roleMiddleware(TIMETABLE_MANAGE), updateRoom);
router.delete("/rooms/:id", roleMiddleware(TIMETABLE_MANAGE), deleteRoom);

// Self-service views
router.get("/teacher/my",                              roleMiddleware(["Teacher", "Subject Coordinator", "Exam Coordinator"]), myTeacherTimetable);
router.get("/student/my",                              roleMiddleware(["Student"]),                                            myStudentTimetable);
router.get("/parent/child/:studentId",                 roleMiddleware(["Parent"]),                                             childTimetable);
router.get("/class-section/:schoolClassId/:sectionId", roleMiddleware(TIMETABLE_READ),                                        classSectionTimetable);

// Admin views
router.get("/class",   roleMiddleware(TIMETABLE_MANAGE), listTimetable);
router.get("/teacher", roleMiddleware(TIMETABLE_MANAGE), listTimetable);
router.get("/",        roleMiddleware(TIMETABLE_MANAGE), listTimetable);

// Timetable CRUD
router.post("/",       roleMiddleware(TIMETABLE_MANAGE), createTimetableEntry);
router.post("/bulk",   roleMiddleware(TIMETABLE_MANAGE), bulkSaveTimetable);
router.post("/copy-week", roleMiddleware(TIMETABLE_MANAGE), copyWeekTimetable);
router.put("/:id",     roleMiddleware(TIMETABLE_MANAGE), updateTimetableEntry);
router.delete("/:id",  roleMiddleware(TIMETABLE_MANAGE), deleteTimetableEntry);

export default router;
