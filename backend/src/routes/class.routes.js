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

// Define roles
const ADMIN_TEACHER = ["Super Admin", "Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "Admin"];

// ✅ Class Routes (Protected)
router.post("/", auth, roleMiddleware(ADMIN_ONLY), createClass);
router.get("/", auth, roleMiddleware(ADMIN_TEACHER), getAllClasses);
router.get("/:id", auth, roleMiddleware(ADMIN_TEACHER), getClassById);
router.put("/:id", auth, roleMiddleware(ADMIN_ONLY), updateClass);
router.delete("/:id", auth, roleMiddleware(ADMIN_ONLY), deleteClass);

export default router;
