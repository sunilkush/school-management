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
// Plans here are always platform-wide (createPlan/updatePlan never reference the model's
// customForSchoolId, and updatePlan propagates every change to every school's subscription) —
// School Admin should never have been able to create/edit/delete a tier every other school
// depends on. Was ADMIN_ONLY, which let any single school's admin take down "Premium" for
// the whole platform.
const SUPER_ADMIN_ONLY = ["Super Admin"];

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

// ⭐ CREATE PLAN — Only Super Admin
router.post(
  "/create",
  auth,
  roleMiddleware(SUPER_ADMIN_ONLY),
  createPlan
);

// ⭐ UPDATE PLAN + SYNC — Only Super Admin
router.put(
  "/:id",
  auth,
  roleMiddleware(SUPER_ADMIN_ONLY),
  updatePlan
);

// ⭐ DELETE PLAN — Only Super Admin
router.delete(
  "/:id",
  auth,
  roleMiddleware(SUPER_ADMIN_ONLY),
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
