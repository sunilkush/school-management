import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  createTask,
  deleteTask,
  getAssignableUsers,
  getTask,
  listTasks,
  updateTask,
} from "../controllers/task.controllers.js";

const router = Router();

router.use(auth);

router.get("/assignable-users", getAssignableUsers);
router.get("/", listTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
