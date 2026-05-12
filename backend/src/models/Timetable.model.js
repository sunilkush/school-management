import mongoose, { Schema } from "mongoose";

const PERIOD_TYPES_REQUIRING_TEACHING = ["regular", "substitution", "activity"];

const timetableSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    dayOfWeek: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: true,
    },
    timeSlotId: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null },
    type: {
      type: String,
      enum: ["regular", "break", "lunch", "assembly", "activity", "substitution"],
      default: "regular",
    },
    note: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

timetableSchema.index(
  { schoolId: 1, academicYearId: 1, schoolClassId: 1, sectionId: 1, dayOfWeek: 1, timeSlotId: 1 },
  { unique: true }
);
timetableSchema.index({ schoolId: 1, academicYearId: 1, teacherId: 1, dayOfWeek: 1 });
timetableSchema.index({ schoolId: 1, academicYearId: 1, sectionId: 1 });

timetableSchema.pre("validate", function validateRegularPeriod(next) {
  if (PERIOD_TYPES_REQUIRING_TEACHING.includes(this.type) && this.status === "active") {
    if (!this.subjectId) return next(new Error("Subject is required for regular periods"));
    if (!this.teacherId) return next(new Error("Teacher is required for regular periods"));
  }
  return next();
});

export const Timetable = mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);
