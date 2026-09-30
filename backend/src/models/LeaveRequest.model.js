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
        "class_teacher",
        "sports_teacher",
        "lab_technician",
        "medical_officer",
        "driver",
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
    /** Half-day leave: "A" = first half, "B" = second half. Only on a single-day request. */
    halfDaySession: { type: String, enum: ["A", "B", null], default: null },
    /**
     * Staff leave is paid from a CL/EL balance (services/leaveBalance.service.js). The days it
     * takes, split by financial year, are worked out when it is filed (Sundays and holidays do
     * not count) so pending requests can hold their days until decided.
     */
    balanceType: { type: String, enum: ["CL", "EL", null], default: null },
    balanceByFy: {
      type: [{ _id: false, fy: Number, days: Number }],
      default: [],
    },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ schoolId: 1, userId: 1, status: 1 });
leaveRequestSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });

// A single-day leave has startDate === endDate (valid), so this only rejects startDate AFTER
// endDate — unlike AcademicYear's stricter "must be before" rule, which doesn't apply here.
leaveRequestSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error("Leave startDate must be on or before endDate"));
  }
  next();
});

export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
