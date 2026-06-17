import mongoose, { Schema } from "mongoose";

const leaveRequestSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: [
        "student",
        "teacher",
        "staff",
        "support_staff",
        "accountant",
        "librarian",
        "receptionist",
        "it_support",
        "counselor",
        "security",
        "hostel_warden",
        "transport_manager",
        "principal",
        "vice_principal",
        "subject_coordinator",
        "exam_coordinator",
        "school_admin",
      ],
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["sick", "casual", "paid", "emergency", "other"],
      required: true,
      default: "casual",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    attachmentUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ schoolId: 1, userId: 1, status: 1 });
leaveRequestSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
