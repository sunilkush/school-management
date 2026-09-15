import express from "express";
import { getTextbookById, getTextbooks, nameTextbookChapter } from "../controllers/textbook.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Everyone who teaches, studies or runs a school reads textbooks. Books are imported, not edited
// through the API — the only write is Super Admin giving a chapter its title.
const READ_ROLES = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Class Teacher", "Sports Teacher", "Subject Coordinator", "Exam Coordinator",
  "Librarian", "Student", "Parent",
];

router.get("/", auth, roleMiddleware(READ_ROLES), getTextbooks);
router.get(
  "/:id",
  auth,
  roleMiddleware(READ_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getTextbookById
);
router.patch(
  "/:id/chapters/:bookChapterNo",
  auth,
  roleMiddleware(["Super Admin"]),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  nameTextbookChapter
);

export default router;
