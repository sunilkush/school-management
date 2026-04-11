import mongoose from "mongoose";

const schoolSubscriptionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true
    },

    snapshot: {
      price: {
        type: Number,
        required: true
      },

      durationInDays: {
        type: Number,
        required: true
      },

      features: [
        {
          module: {
            type: String,
            required: true
          },

          allowed: {
            type: Boolean,
            default: true
          },

          limits: mongoose.Schema.Types.Mixed
        }
      ]
    },

    autoSyncPlanUpdates: {
      type: Boolean,
      default: true
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    endDate: {
      type: Date,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },

    renewalPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan"
    }
  },
  { timestamps: true }
);

export const SchoolSubscription =
  mongoose.models.SchoolSubscription ||
  mongoose.model("SchoolSubscription", schoolSubscriptionSchema);

