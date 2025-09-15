import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },

    // Date Info
    date: { type: Date, required: true, index: true },
    session: { type: String, enum: ["Morning", "Afternoon", "FullDay"], default: "FullDay" }, // ✅ Half-day / session support

    // Entity Info
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["Student", "Teacher"], required: true },

    // Attendance Status
    status: { 
      type: String, 
      enum: ["Present", "Absent", "Leave", "Holiday", "Late", "Excused"], 
      required: true 
    },
    remarks: { type: String, maxlength: 200 },

    // Student-specific
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },

    // Teacher-specific
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },

    // Metadata
    markedBy: { type: Schema.Types.ObjectId, ref: "User" }, // ✅ who marked attendance
    markedAt: { type: Date, default: Date.now },

    // Audit trail
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true }); // ✅ Prevent duplicate marking

export const Attendance = mongoose.model("Attendance", attendanceSchema);
