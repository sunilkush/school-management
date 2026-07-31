import mongoose, { Schema } from "mongoose";

const HostelAttendanceSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null },

    date: { type: Date, required: true },
    session: {
      type: String,
      enum: ["morning", "evening", "night"],
      required: true,
    },

    records: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        studentName: { type: String, trim: true },
        roomNumber: { type: String, trim: true },
        status: {
          type: String,
          enum: ["present", "absent", "leave"],
          required: true,
        },
        note: { type: String, trim: true },
      },
    ],

    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalOnLeave: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HostelAttendanceSchema.index({ schoolId: 1, date: -1, session: 1 }, { unique: true });
HostelAttendanceSchema.index({ schoolId: 1, date: -1 });

HostelAttendanceSchema.pre("save", function (next) {
  this.totalPresent  = this.records.filter((r) => r.status === "present").length;
  this.totalAbsent   = this.records.filter((r) => r.status === "absent").length;
  this.totalOnLeave  = this.records.filter((r) => r.status === "leave").length;
  next();
});

export const HostelAttendance = mongoose.model("HostelAttendance", HostelAttendanceSchema);
