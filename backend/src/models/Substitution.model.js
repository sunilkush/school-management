import mongoose, { Schema } from "mongoose";

/**
 * One covered period on one date.
 *
 * Deliberately a separate, DATE-KEYED overlay rather than an edit to the Timetable row. The
 * Timetable is the recurring weekly schedule — repointing its teacherId to cover a single day's
 * absence would silently change every following week too. A Substitution leaves the schedule
 * intact and simply says "on this date, this period is taken by someone else".
 *
 * Class, section, slot and subject are denormalised from the timetable row so the daily
 * substitution register can be listed and printed without joining back through it.
 */
const substitutionSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },

    // Normalised to UTC midnight so a day is a single comparable value (same convention as
    // jobs/autoCheckout.job.js).
    date: { type: Date, required: true, index: true },

    timetableId: { type: Schema.Types.ObjectId, ref: "Timetable", required: true },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", default: null },
    timeSlotId: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },

    absentTeacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    substituteTeacherId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    reason: { type: String, enum: ["leave", "absent", "other"], default: "absent" },
    leaveRequestId: { type: Schema.Types.ObjectId, ref: "LeaveRequest", default: null },
    note: { type: String, trim: true, maxlength: 500, default: "" },

    status: {
      type: String,
      enum: ["proposed", "assigned", "cancelled"],
      default: "proposed",
      index: true,
    },

    notifiedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// A period on a given date can only be covered once.
substitutionSchema.index({ schoolId: 1, date: 1, timetableId: 1 }, { unique: true });
// Drives both the daily register and "what am I covering this week".
substitutionSchema.index({ schoolId: 1, date: 1, status: 1 });
substitutionSchema.index({ schoolId: 1, substituteTeacherId: 1, date: 1 });

export const Substitution =
  mongoose.models.Substitution || mongoose.model("Substitution", substitutionSchema);
