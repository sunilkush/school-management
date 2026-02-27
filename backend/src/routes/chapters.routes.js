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

// ✅ Roles
const ADMIN_ROLES = ["Super Admin", "School Admin"];

/* =====================================================
   🌍 CHAPTER CORE ROUTES
===================================================== */

// ✅ Create Chapter (Super Admin + School Admin)
router.post(
  "/",
  auth,
  roleMiddleware(ADMIN_ROLES),
  createChapter
);

// ⭐ Visible Chapters (MOST IMPORTANT — RBAC)
router.get(
  "/visible",
  auth,
  roleMiddleware(ADMIN_ROLES),
  getVisibleChapters
);

// ✅ Get All Chapters (Super Admin only)
router.get(
  "/",
  auth,
  roleMiddleware(["Super Admin"]),
  getAllChapters
);

// ✅ Get Single Chapter
router.get(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  getChapterById
);

// ✅ Update Chapter
router.patch(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  updateChapter
);

// ✅ Soft Delete Chapter
router.delete(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ROLES),
  deleteChapter
);

/* =====================================================
   🏫 CHAPTER → SCHOOL ASSIGN
===================================================== */

// ⭐ Assign Global Chapter to School (Super Admin only)
router.post(
  "/assign-school",
  auth,
  roleMiddleware(["Super Admin"]),
  assignChapterToSchool
);

export default router;