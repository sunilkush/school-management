import express from "express";
import {
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  assignChapterToSchool,
  getVisibleChapters,
} from "../controllers/chapter.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const ADMIN_ROLE = ["Super Admin", "School Admin"];

/* =====================================================
   🔐 PROTECTED BASE
===================================================== */

router.use(auth);

/* =====================================================
   🌍 CHAPTER CORE ROUTES
===================================================== */

// ✅ Create Chapter
router.post(
  "/",
  roleMiddleware(...ADMIN_ROLE),
  createChapter
);

// ⭐ MOST IMPORTANT — Visible Chapters
router.get(
  "/visible",
  roleMiddleware(...ADMIN_ROLE),
  getVisibleChapters
);

// ✅ Get All Chapters (Super Admin only)
router.get(
  "/",
  roleMiddleware("Super Admin"),
  getAllChapters
);

// ✅ Get Single Chapter
router.get(
  "/:id",
  roleMiddleware(...ADMIN_ROLE),
  getChapterById
);

// ✅ Update Chapter
router.patch(
  "/:id",
  roleMiddleware(...ADMIN_ROLE),
  updateChapter
);

// ✅ Soft Delete Chapter
router.delete(
  "/:id",
  roleMiddleware(...ADMIN_ROLE),
  deleteChapter
);

/* =====================================================
   🏫 CHAPTER → SCHOOL ASSIGN
===================================================== */

// ⭐ Assign Global Chapter to School
router.post(
  "/assign-school",
  roleMiddleware("Super Admin"),
  assignChapterToSchool
);

export default router;