import mongoose from "mongoose";

const planLimitsSchema = new mongoose.Schema(
  {
    maxSchools: { type: Number, min: 0 },
    maxStudents: { type: Number, min: 0 },
    maxTeachers: { type: Number, min: 0 },
    maxStorage: { type: Number, min: 0 },
    maxSMS: { type: Number, min: 0 },
    maxUsers: { type: Number, min: 0 },
  },
  { _id: false }
);

const moduleAccessSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true },
    allowed: { type: Boolean, default: true },
    limits: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Starter", "Premium", "Enterprise", "Custom"],
      default: "Starter",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },

    isTrialPlan: {
      type: Boolean,
      default: false,
    },

    trialDurationInDays: {
      type: Number,
      min: 1,
      default: null,
    },

    customForSchoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },

    features: {
      type: [moduleAccessSchema],
      default: [],
    },

    limits: {
      type: planLimitsSchema,
      default: () => ({}),
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ name: 1, customForSchoolId: 1 }, { unique: true });

export const SubscriptionPlan =
  mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
