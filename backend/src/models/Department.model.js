import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    head: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

departmentSchema.index({ name: 1, schoolId: 1 }, { unique: true, sparse: true });

export const Department = mongoose.model("Department", departmentSchema);
