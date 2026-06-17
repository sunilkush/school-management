import mongoose, { Schema } from "mongoose";

const designationSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Designation title is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: ["Senior", "Mid", "Junior"],
      default: "Mid",
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
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

export const Designation = mongoose.model("Designation", designationSchema);
