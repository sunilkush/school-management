import express from "express";
import {
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  getVisibleChapters,
} from "../controllers/chapter.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Only admins, teachers, and subject coordinators can create/edit chapters
const WRITE_ROLES = [
  "Super Admin", "School Admin",
  "Teacher", "Subject Coordinator",
];

// All academic and leadership staff can read chapters
const READ_ROLES = [
  "Super Admin", "School Admin",
  "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
];

// Students/Parents see visible chapters
const VISIBLE_ROLES = [...READ_ROLES, "Student", "Parent"];

router.post("/",
  auth,
  roleMiddleware(WRITE_ROLES),
  createChapter
);

router.get("/visible", auth, roleMiddleware(VISIBLE_ROLES), getVisibleChapters);
router.get("/",        auth, roleMiddleware(READ_ROLES),    getAllChapters);
router.get("/:id",
  auth,
  roleMiddleware(READ_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getChapterById
);
router.patch("/:id",
  auth,
  roleMiddleware(WRITE_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  updateChapter
);
router.delete("/:id",
  auth,
  roleMiddleware(["Super Admin", "School Admin"]),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  deleteChapter
);

export default router;
