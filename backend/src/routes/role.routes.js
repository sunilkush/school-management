import express from "express";
import {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole,
    getRoleBySchool,
    searchRoles
} from "../controllers/role.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Define allowed roles
const ADMIN_ROLE = ["Super Admin", "School Admin"];

/**
 * Create a Role
 * Access: Super Admin / School Admin
 */
router.post("/createRole", auth, roleMiddleware(ADMIN_ROLE),createRole);

/**
 * Get All Roles (with optional filters: ?schoolId= &?name=)
 * Access: Super Admin / School Admin
 */
router.get("/getAllRoles", auth, roleMiddleware(ADMIN_ROLE), getAllRoles);

/**
 * Search Roles (advanced search by name, level, permissions, etc.)
 * Access: Super Admin / School Admin
 */
router.get("/search", auth, roleMiddleware(ADMIN_ROLE), searchRoles);

/**
 * Get Role by ID
 * Access: Super Admin / School Admin
 */
router.get("/getRole/:id", auth, roleMiddleware(ADMIN_ROLE), getRoleById);

/**
 * Update Role by ID
 * Access: Super Admin / School Admin
 */
router.put("/updateRole/:id", auth, roleMiddleware(ADMIN_ROLE), updateRole);

/**
 * Delete Role by ID
 * Access: Super Admin / School Admin
 */
router.delete("/deleteRole/:id", auth, roleMiddleware(ADMIN_ROLE), deleteRole);

/**
 * Get Roles by School ID
 * Access: Super Admin / School Admin
 */
router.get("/by-school", auth, roleMiddleware(ADMIN_ROLE), getRoleBySchool);

export default router;
