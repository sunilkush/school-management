import express from "express";
import {
    createRole, getAllRoles, getRoleById, updateRole, deleteRole
} from "../controllers/role.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, roleMiddleware(["Super Admin"]), createRole);
router.get("/", auth, roleMiddleware(["Super Admin", "Admin"]), getAllRoles);
router.get("/:id", auth, roleMiddleware(["Super Admin", "Admin"]), getRoleById);
router.put("/:id", auth, roleMiddleware(["Super Admin"]), updateRole);
router.delete("/:id", auth, roleMiddleware(["Super Admin"]), deleteRole);

export default router;
