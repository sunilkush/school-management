import express from "express";
import { getGradingScale, updateGradingScale } from "../controllers/gradingScale.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const ADMIN_ROLE = ["Super Admin", "School Admin"];

router.get(
  "/",
  auth,
  roleMiddleware([...ADMIN_ROLE, "Teacher", "Principal", "Vice Principal", "Exam Coordinator"]),
  getGradingScale
);
router.put("/", auth, roleMiddleware(ADMIN_ROLE), updateGradingScale);

export default router;
