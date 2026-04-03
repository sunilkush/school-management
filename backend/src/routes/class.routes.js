import { Router } from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
  getClassById,
} from "../controllers/class.controllers.js";
import { requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];

router.post("/", requireRoles(ADMIN_ONLY), createClass);
router.get("/", requireRoles(ADMIN_TEACHER), getAllClasses);
router.get("/:schoolClassId", requireRoles(ADMIN_TEACHER), getClassById);
router.put("/:schoolClassId", requireRoles(ADMIN_ONLY), updateClass);
router.delete("/:schoolClassId", requireRoles(ADMIN_ONLY), deleteClass);

// backward compatibility
router.post("/create", requireRoles(ADMIN_ONLY), createClass);
router.get("/all", requireRoles(ADMIN_TEACHER), getAllClasses);

export default router;
