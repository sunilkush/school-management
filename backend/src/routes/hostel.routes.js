import express from "express";
import {
  assignStudentToRoom,
  createHostelRoom,
  deleteHostelRoom,
  getHostelRooms,
  updateHostelRoom,
} from "../controllers/hostelRoom.controllers.js";

const router = express.Router();

router.get("/rooms", getHostelRooms);
router.post("/rooms", createHostelRoom);
router.put("/rooms/:id", updateHostelRoom);
router.delete("/rooms/:id", deleteHostelRoom);
router.post("/rooms/:id/assign", assignStudentToRoom);

export default router;
