import express from "express";
import { createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controllers/employee.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Define allowed roles
const ADMIN_ROLES = ["admin", "superadmin"];
const EMPLOYEE_ROLES = ["admin", "superadmin", "employee"];

// ✅ Create Employee (Only Admins & Superadmins)
router.post("/", auth, roleMiddleware(ADMIN_ROLES), createEmployee);

// ✅ Get All Employees (Admins & Employees Can View)
router.get("/allEmployee", auth, roleMiddleware(EMPLOYEE_ROLES), getAllEmployees);

// ✅ Get Employee by ID (Admins & Employees Can View)
router.get("/getEmployee/:id", auth, roleMiddleware(EMPLOYEE_ROLES), getEmployeeById);

// ✅ Update Employee (Only Admins & Superadmins)
router.put("/updateEmployee/:id", auth, roleMiddleware(ADMIN_ROLES), updateEmployee);

// ✅ Delete Employee (Only Admins & Superadmins)
router.delete("/deleteEmployee/:id", auth, roleMiddleware(ADMIN_ROLES), deleteEmployee);

export default router;
