import mongoose, { Schema } from "mongoose";

const timeSlotSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["period", "break", "lunch", "assembly", "activity"],
      default: "period",
    },
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

timeSlotSchema.index({ schoolId: 1, academicYearId: 1, name: 1 }, { unique: true });
timeSlotSchema.index({ schoolId: 1, academicYearId: 1, order: 1 });

export const TimeSlot = mongoose.models.TimeSlot || mongoose.model("TimeSlot", timeSlotSchema);
