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

const ADMIN_ROLES = ["Super Admin", "School Admin"];
const READ_ROLES = ["Super Admin", "School Admin", "Teacher"];

router.post(
  "/",
  auth,
  roleMiddleware(ADMIN_ROLES),
  /* validate({
    body: {
      name: { required: true, type: "string" },
      schoolClassId: { required: false, type: "objectId" },
      boardClassId: { required: false, type: "objectId" },
      subjectId: { required: true, type: "objectId" },
    },
  }), */
  createChapter
);

router.get("/visible", auth, roleMiddleware(READ_ROLES), getVisibleChapters);
router.get("/", auth, roleMiddleware(READ_ROLES), getAllChapters);
router.get("/:id", auth, roleMiddleware(READ_ROLES), validate({ params: { id: { required: true, type: "objectId" } } }), getChapterById);
router.patch("/:id", auth, roleMiddleware(ADMIN_ROLES), validate({ params: { id: { required: true, type: "objectId" } } }), updateChapter);
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLES), validate({ params: { id: { required: true, type: "objectId" } } }), deleteChapter);

export default router;
