import { Router } from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth, roleMiddleware("Super Admin"), createDepartment);
router.get("/", auth, roleMiddleware(["Super Admin", "School Admin"]), getDepartments);
router.get("/:id", auth, roleMiddleware(["Super Admin", "School Admin"]), getDepartmentById);
router.put("/:id", auth, roleMiddleware("Super Admin"), updateDepartment);
router.delete("/:id", auth, roleMiddleware("Super Admin"), deleteDepartment);

export default router;
