import mongoose from "mongoose";

const maintenanceTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date, default: null },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Task boards are queried "for this school, filtered by status" — no index existed at all.
maintenanceTaskSchema.index({ school: 1, status: 1 });

export default mongoose.model("MaintenanceTask", maintenanceTaskSchema);
