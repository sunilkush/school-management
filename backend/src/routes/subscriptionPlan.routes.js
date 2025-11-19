// routes/subscriptionPlan.routes.js

import { Router } from "express";
import {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getPlanUpdateLogs,
} from "../controllers/subscriptionPlan.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔑 Role Groups
const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];

// =====================================================
// 📌 PUBLIC ROUTES (If your business model allows)
// =====================================================

// Get all plans (Public)
router.get("/allplan",auth, getAllPlans);

// Get single plan (Public)
router.get("/:id", getPlanById);

// =====================================================
// 🔐 PROTECTED ROUTES (Admin Level Control)
// =====================================================

// ⭐ CREATE PLAN — Only Super Admin & School Admin
router.post(
  "/create",
  auth,
  roleMiddleware(ADMIN_ONLY),
  createPlan
);

// ⭐ UPDATE PLAN + SYNC — Only Super Admin & School Admin
router.put(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ONLY),
  updatePlan
);

// ⭐ DELETE PLAN — Only Super Admin & School Admin
router.delete(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ONLY),
  deletePlan
);

// ⭐ GET PLAN UPDATE LOGS — Super Admin, School Admin, Teacher
router.get(
  "/:id/logs",
  auth,
  roleMiddleware(ADMIN_TEACHER),
  getPlanUpdateLogs
);

export default router;
