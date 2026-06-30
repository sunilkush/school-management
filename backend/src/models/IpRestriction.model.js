import mongoose, { Schema } from "mongoose";

const ipRestrictionSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["whitelist", "blacklist"],
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

ipRestrictionSchema.index({ schoolId: 1, type: 1, isActive: 1 });

export const IpRestriction = mongoose.model("IpRestriction", ipRestrictionSchema);
