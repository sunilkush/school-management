import mongoose, { Schema } from "mongoose";

const ptmSlotSchema = new Schema(
  {
    ptmSessionId: { type: Schema.Types.ObjectId, ref: "PTMSession", required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ["Available", "Booked", "Completed", "Cancelled"], default: "Available", index: true },

    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    studentName: { type: String, trim: true, default: "" },
    parentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    bookedAt: { type: Date, default: null },

    attended: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: "" },
    cancelReason: { type: String, trim: true, default: "" },

    // Set once the day-before reminder job has notified this slot's parent — prevents re-sending
    // on every daily cron run while the slot remains Booked.
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ptmSlotSchema.index({ schoolId: 1, ptmSessionId: 1 });
ptmSlotSchema.index({ schoolId: 1, status: 1 });
ptmSlotSchema.index({ studentId: 1 });
ptmSlotSchema.index({ parentId: 1 });
ptmSlotSchema.index({ status: 1, reminderSentAt: 1, startTime: 1 });

export const PTMSlot =
  mongoose.models.PTMSlot || mongoose.model("PTMSlot", ptmSlotSchema);
