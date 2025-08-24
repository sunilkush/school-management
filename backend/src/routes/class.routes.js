import { Router } from "express";
import {
    createClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass
} from "../controllers/class.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔑 Role Groups
const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];

// ============================
// 📌 Class Routes (Protected)
// ============================

// ➕ Create Class
router.post("/create", auth, roleMiddleware(ADMIN_ONLY), createClass);

// 📋 Get All Classes (with pagination, filtering, search)
router.get("/all", auth, roleMiddleware(ADMIN_TEACHER), getAllClasses);

// 🔍 Get Class by ID
router.get("/:classId", auth, roleMiddleware(ADMIN_TEACHER), getClassById);

// ✏️ Update Class
router.put("/:classId", auth, roleMiddleware(ADMIN_ONLY), updateClass);

// 🗑️ Delete Class
router.delete("/:classId", auth, roleMiddleware(ADMIN_ONLY), deleteClass);

export default router;
