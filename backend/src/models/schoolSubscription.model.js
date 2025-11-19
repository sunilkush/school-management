import mongoose from "mongoose";
const schoolSubscriptionSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School"
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan"
    },

    // Snapshot of plan at the time of purchase
    snapshot: {
        price: {
            type: Number,
            required: true,
            min: 0
        },
        durationInDays: {
            type: Number,
            required: true,
            min: 1
        },
        features: {
            module: {
                type: String,
                required: true,
            },
            allowed: {
                type: Boolean,
                default: true
            },
            limits: {
                type: mongoose.Schema.Types.Mixed // e.g. { maxStudents: 500 }

            }
        }
    },

    autoSyncPlanUpdates: { type: Boolean, default: true }, // 🔥 Plan update apply to school automatically

    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true,

    },

    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },

    renewalPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan"
    },
}, { timestamps: true });

export const SchoolSubscription = mongoose.model("SchoolSubscription", schoolSubscriptionSchema);