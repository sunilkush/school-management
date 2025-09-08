import express from "express";
import {
  createClassSection,
  getClassSections,
  getClassSectionById,
  updateClassSection,
  deleteClassSection,
} from "../controllers/classSection&subject.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
const router = express.Router();

const ADMIN_ONLY = ["Super Admin", "School Admin"];
// 🔹 Create a new Class-Section mapping (with optional subjects)
router.post("/", createClassSection);

// 🔹 Get all Class-Section mappings (with optional filters)
router.get("/", auth, roleMiddleware(ADMIN_ONLY), getClassSections);

// 🔹 Get a single Class-Section mapping by ID
router.get("/:id", auth, roleMiddleware(ADMIN_ONLY), getClassSectionById);

// 🔹 Update a Class-Section mapping by ID
router.put("/:id", auth, roleMiddleware(ADMIN_ONLY), updateClassSection);

// 🔹 Delete a Class-Section mapping by ID
router.delete("/:id", auth, roleMiddleware(ADMIN_ONLY), deleteClassSection);

export default router;
