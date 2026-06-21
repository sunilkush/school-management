import mongoose, { Schema } from "mongoose";

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done", "cancelled"],
      default: "todo",
    },
    dueDate: { type: Date, default: null },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    completedAt: { type: Date, default: null },
    /* per-assignee status tracking */
    assigneeStatus: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["todo", "in_progress", "done"],
          default: "todo",
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

TaskSchema.index({ schoolId: 1, createdAt: -1 });
TaskSchema.index({ assignedTo: 1 });

export const Task = mongoose.model("Task", TaskSchema);
