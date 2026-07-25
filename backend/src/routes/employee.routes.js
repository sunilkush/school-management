import express from "express";
import { registerEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controllers/employee.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Define allowed roles
const ADMIN_ROLES = ["School Admin", "Super Admin", "Accountant"];
const EMPLOYEE_ROLES = ["School Admin", "Super Admin", "Teacher", "Accountant", "Sports Teacher", "Transport Manager"];
// Transport Manager needs to update its own driver roster (designation/department/phone from
// the Drivers page) but should not get the broader create/deactivate rights ADMIN_ROLES has.
const EMPLOYEE_UPDATE_ROLES = [...ADMIN_ROLES, "Transport Manager"];

// ✅ Create Employee (Only Admins & Superadmins)
router.post("/", auth, roleMiddleware(ADMIN_ROLES), registerEmployee);

// ✅ Get All Employees (Admins & Employees Can View)
router.get("/", auth, roleMiddleware(EMPLOYEE_ROLES), getAllEmployees);
router.get("/allEmployee", auth, roleMiddleware(EMPLOYEE_ROLES), getAllEmployees);

// ✅ Get Employee by ID (Admins & Employees Can View)
router.get("/getEmployee/:id", auth, roleMiddleware(EMPLOYEE_ROLES), getEmployeeById);

// ✅ Update Employee (Admins, Superadmins, and Transport Manager for driver records)
router.put("/updateEmployee/:id", auth, roleMiddleware(EMPLOYEE_UPDATE_ROLES), updateEmployee);

// ✅ Delete Employee (Only Admins & Superadmins)
router.delete("/deleteEmployee/:id", auth, roleMiddleware(ADMIN_ROLES), deleteEmployee);

export default router;
