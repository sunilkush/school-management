import mongoose, { Schema } from "mongoose";

const HostelLeaveSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYears", default: null },

    roomNumber: { type: String, trim: true },
    leaveType: {
      type: String,
      enum: ["home", "emergency", "medical", "personal", "other"],
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    parentPhone: { type: String, trim: true },
    destinationAddress: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvalNote: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },

    checkOutTime: { type: Date, default: null },
    checkInTime: { type: Date, default: null },

    isEmergency: { type: Boolean, default: false },
  },
  { timestamps: true }
);

HostelLeaveSchema.index({ schoolId: 1, status: 1 });
HostelLeaveSchema.index({ schoolId: 1, fromDate: -1 });
HostelLeaveSchema.index({ studentId: 1, fromDate: -1 });

export const HostelLeave = mongoose.model("HostelLeave", HostelLeaveSchema);
