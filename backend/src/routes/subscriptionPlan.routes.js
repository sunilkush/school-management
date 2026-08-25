// routes/subscriptionPlan.routes.js

import { Router } from "express";
import {
  getAllPlans,
  getPlanById,
  getPlanUpdateLogs,
} from "../controllers/subscriptionPlan.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔑 Role Groups
const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];

// Read-only router now — plan creation/update/delete used to be duplicated here (hard-delete,
// no limits-sync) AND in superAdminBilling.controllers.js's *PlanV2 functions (soft-deactivate,
// syncs limits), both editing the same SubscriptionPlan model from two different frontend
// pieces. Consolidated onto the v2 (superAdminBilling) implementation — see
// POST/PUT/DELETE /super-admin/billing/plans. This router keeps only the reads, which were
// never duplicated.

// Get all plans
router.get("/allplan", auth, getAllPlans);

// Get single plan — previously had no auth at all (fully public to the internet); plan details
// aren't sensitive, but there's no reason for zero authentication either.
router.get("/:id", auth, getPlanById);

// Get plan update logs — Super Admin, School Admin, Teacher
router.get(
  "/:id/logs",
  auth,
  roleMiddleware(ADMIN_TEACHER),
  getPlanUpdateLogs
);

export default router;
