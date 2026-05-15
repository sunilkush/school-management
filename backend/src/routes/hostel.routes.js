import express from "express";
import {
  assignStudentToRoom,
  createHostelRoom,
  deleteHostelRoom,
  getHostelRooms,
  removeStudentFromRoom,
  updateHostelRoom,
} from "../controllers/hostelRoom.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const HOSTEL_MANAGE_ROLES = ["Super Admin", "School Admin", "Admin", "Principal", "Vice Principal", "Hostel Warden"];
const HOSTEL_VIEW_ROLES = [...HOSTEL_MANAGE_ROLES, "Teacher", "Student", "Parent"];

router.get("/rooms", auth, roleMiddleware(HOSTEL_VIEW_ROLES), getHostelRooms);
router.post("/rooms", auth, roleMiddleware(HOSTEL_MANAGE_ROLES), createHostelRoom);
router.put("/rooms/:id", auth, roleMiddleware(HOSTEL_MANAGE_ROLES), updateHostelRoom);
router.delete("/rooms/:id", auth, roleMiddleware(HOSTEL_MANAGE_ROLES), deleteHostelRoom);
router.post("/rooms/:id/assign", auth, roleMiddleware(HOSTEL_MANAGE_ROLES), assignStudentToRoom);
router.delete("/rooms/:id/students/:studentId", auth, roleMiddleware(HOSTEL_MANAGE_ROLES), removeStudentFromRoom);

export default router;
