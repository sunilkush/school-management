// controllers/subscriptionPlan.controller.js

import { SubscriptionPlan } from "../models/SubscriptionPlan.model.js";
import { PlanUpdateLog } from "../models/planUpdateLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// Plan create/update/delete used to live here too, duplicating superAdminBilling.controllers.js's
// createPlanV2/updatePlanV2/deactivatePlan against the same SubscriptionPlan model with
// different (worse) behavior — hard-delete instead of soft-deactivate, no limits sync on
// update. Consolidated onto that implementation; only reads remain in this file.

// ======================================
// ✅ GET ALL PLANS
// ======================================
export const getAllPlans = asyncHandler(async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, plans, "Plans fetched successfully"));
  } catch (error) {
    console.error("Get Plans Error:", error);
    throw new ApiError(500, error?.message || "Failed to fetch plans");
  }
});



// ======================================
// ✅ GET SINGLE PLAN
// ======================================

export const getPlanById = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) throw new ApiError(404, "Plan not found");

    return res
        .status(200)
        .json(new ApiResponse(200, plan, "Plan fetched successfully"));
});


// ======================================
// ✅ GET ALL UPDATE LOGS FOR A PLAN
// ======================================

export const getPlanUpdateLogs = asyncHandler(async (req, res) => {
    const logs = await PlanUpdateLog.find({ planId: req.params.id })
        .populate("updatedBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, logs, "Plan update logs fetched successfully"));
});
