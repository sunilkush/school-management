// controllers/subscriptionPlan.controller.js

import { SubscriptionPlan } from "../models/SubscriptionPlan.model.js";
import { PlanUpdateLog } from "../models/planUpdateLog.model.js";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// ======================================
// ✅ CREATE SUBSCRIPTION PLAN
// ======================================

export const createPlan = asyncHandler(async (req, res) => {
  try {
    const { name, price, durationInDays, features, isActive } = req.body;

    // ------------------------------
    //  Validate Required Fields
    // ------------------------------
    if (!name || !price || !durationInDays || !features) {
      throw new ApiError(400, "Missing required fields");
    }

    // ------------------------------
    //  Duplicate Check
    // ------------------------------
    const existing = await SubscriptionPlan.findOne({ name: name.trim() });
    if (existing) {
      throw new ApiError(400, "Subscription Plan with this name already exists");
    }

    // ------------------------------
    //  Create New Plan
    // ------------------------------
    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      price,
      durationInDays,
      features, // array will be saved directly
      isActive: isActive !== undefined ? isActive : true,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, plan, "Subscription Plan created successfully"));
  } catch (error) {
  
    throw new ApiError(500, "Failed to create subscription plan");
  }
});


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
// ✅ UPDATE PLAN + LOG HISTORY + PROPAGATE
// ======================================

export const updatePlan = asyncHandler(async (req, res) => {
    const planId = req.params.id;
    const updatedBy = req.user?._id;

    const oldPlan = await SubscriptionPlan.findById(planId);
    if (!oldPlan) throw new ApiError(404, "Plan not found");

    const oldData = oldPlan.toObject();

    // Update plan
    const newPlan = await SubscriptionPlan.findByIdAndUpdate(planId, req.body, {
        new: true,
        runValidators: true,
    });

    const newData = newPlan.toObject();

    // Save log history
    await PlanUpdateLog.create({
        planId,
        oldData,
        newData,
        updatedBy,
    });

    // Propagate updates to all schools using this plan
    const schoolSubs = await SchoolSubscription.find({ planId });

    for (const sub of schoolSubs) {
        if (sub.autoSyncPlanUpdates === true) {
            sub.snapshot = {
                price: newPlan.price,
                durationInDays: newPlan.durationInDays,
                features: newPlan.features,
            };
            await sub.save();
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newPlan, "Plan updated successfully"));
});


// ======================================
// ✅ DELETE PLAN
// ======================================

export const deletePlan = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) throw new ApiError(404, "Plan not found");

    await plan.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Subscription Plan deleted successfully"));
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
