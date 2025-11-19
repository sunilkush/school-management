import mongoose from "mongoose";

const planUpdateLogSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    oldData: {
      type: Object,
      required: true, // before update snapshot
    },

    newData: {
      type: Object,
      required: true, // after update snapshot
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin/User who updated the plan
      required: true,
    },
  },

  // Auto timestamps: createdAt, updatedAt
  { timestamps: true }
);

export const PlanUpdateLog = mongoose.model(
  "PlanUpdateLog",
  planUpdateLogSchema
);
