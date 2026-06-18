import mongoose, { Schema } from "mongoose";

const HostelComplaintSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYears", default: null },

    roomNumber: { type: String, trim: true },
    complaintNo: { type: String, trim: true, index: true },

    type: {
      type: String,
      enum: ["room", "food", "maintenance", "safety", "electricity", "plumbing", "furniture", "cleanliness", "other"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed", "rejected"],
      default: "open",
      index: true,
    },

    assignedTo: { type: String, trim: true },
    resolution: { type: String, trim: true },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    actionHistory: [
      {
        action: String,
        note: String,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

HostelComplaintSchema.index({ schoolId: 1, status: 1 });
HostelComplaintSchema.index({ schoolId: 1, createdAt: -1 });

HostelComplaintSchema.pre("save", async function (next) {
  if (!this.complaintNo) {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.complaintNo = `HC-${ymd}-${rand}`;
  }
  next();
});

export const HostelComplaint = mongoose.model("HostelComplaint", HostelComplaintSchema);
