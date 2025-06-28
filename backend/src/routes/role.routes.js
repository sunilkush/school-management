import express from "express";
import {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole,
    getRoleBySchool
} from "../controllers/role.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Define allowed roles
const ADMIN_ROLE = ["Super Admin", "School Admin"];

//  Create a Role (Only Admin)
router.post("/createRole", auth, roleMiddleware(ADMIN_ROLE), createRole);

//  Get All Roles (Only Admin)
router.get("/getAllRoles", auth, roleMiddleware(ADMIN_ROLE), getAllRoles);

//  Get Role by ID (Only Admin)
router.get("/getRole/:id", auth, getRoleById);

//  Update Role (Only Admin)
router.put("/updateRole/:id", auth, roleMiddleware(ADMIN_ROLE), updateRole);

//  Delete Role (Only Admin)
router.delete("/deleteRole/:id", auth, roleMiddleware(ADMIN_ROLE), deleteRole);
router.get("/by-school", auth, roleMiddleware(ADMIN_ROLE), getRoleBySchool)

export default router;
