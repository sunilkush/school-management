import mongoose, { Schema } from "mongoose";

/**
 * A staff member's claim to have worked a Sunday or a school holiday. Once an admin approves it,
 * the day (or half day) is added to their Comp Off (CO) balance (LeaveLedger kind "compoff"),
 * which is taken as leave like CL and EL and, if unused on 31 March, paid with March salary.
 */
const compOffClaimSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** The day worked, as an attendance day (UTC midnight of the IST date). */
    date: { type: Date, required: true },
    days: { type: Number, enum: [0.5, 1], required: true },
    reason: { type: String, trim: true, required: true, maxlength: 300 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true }
);

// One live claim per person per day; a rejected one can be made again.
compOffClaimSchema.index(
  { userId: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "approved"] } } }
);

export const CompOffClaim = mongoose.model("CompOffClaim", compOffClaimSchema);
