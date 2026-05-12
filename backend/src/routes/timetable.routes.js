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
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.get("/time-slots", listTimeSlots);
router.post("/time-slots", createTimeSlot);
router.put("/time-slots/:id", updateTimeSlot);
router.delete("/time-slots/:id", deleteTimeSlot);

router.get("/rooms", listRooms);
router.post("/rooms", createRoom);
router.put("/rooms/:id", updateRoom);
router.delete("/rooms/:id", deleteRoom);

router.get("/teacher/my", myTeacherTimetable);
router.get("/student/my", myStudentTimetable);
router.get("/parent/child/:studentId", childTimetable);
router.get("/class-section/:schoolClassId/:sectionId", classSectionTimetable);

router.get("/class", listTimetable);
router.get("/teacher", listTimetable);
router.get("/", listTimetable);
router.post("/", createTimetableEntry);
router.post("/bulk", bulkSaveTimetable);
router.post("/copy-week", copyWeekTimetable);
router.put("/:id", updateTimetableEntry);
router.delete("/:id", deleteTimetableEntry);


export default router;