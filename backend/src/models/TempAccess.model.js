import mongoose from "mongoose";

const tempAccessSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scope: { type: String, default: "global", trim: true },
    reason: { type: String, required: true, trim: true },
    validTill: { type: Date, required: true },
    status: { type: String, enum: ["Active", "Expired", "Revoked"], default: "Active" },
  },
  { timestamps: true }
);

export const TempAccess = mongoose.model("TempAccess", tempAccessSchema);
