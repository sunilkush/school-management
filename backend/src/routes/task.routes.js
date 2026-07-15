import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createTask,
  deleteTask,
  getAssignableUsers,
  getTask,
  listTasks,
  updateTask,
} from "../controllers/task.controllers.js";

const router = Router();

// Supervisory roles can create/assign tasks
const TASK_MANAGE = [
  "Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher",
];

// All staff can view tasks assigned to them
const TASK_READ = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Class Teacher", "Sports Teacher", "Lab Technician", "Medical Officer",
  "Subject Coordinator", "Exam Coordinator",
  "Accountant", "Librarian", "Hostel Warden", "Transport Manager",
  "Receptionist", "IT Support", "Counselor", "Staff", "Support Staff", "Security",
  "Sports Teacher", "Lab Technician", "Medical Officer", "Class Teacher",
];

router.use(auth);

router.get("/assignable-users", roleMiddleware(TASK_MANAGE), getAssignableUsers);
router.get("/",                 roleMiddleware(TASK_READ),   listTasks);
router.post("/",                roleMiddleware(TASK_MANAGE), createTask);
router.get("/:id",              roleMiddleware(TASK_READ),   getTask);
router.patch("/:id",            roleMiddleware(TASK_MANAGE), updateTask);
router.delete("/:id",           roleMiddleware(TASK_MANAGE), deleteTask);

export default router;
