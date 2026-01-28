import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },

    // Date Info
    date: { type: Date, required: true, index: true },
    session: {
      type: String,
      enum: ["Morning", "Afternoon", "FullDay"],
      default: "FullDay",
    },

    // Entity Info
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    role: {
      type: String,
      enum: ["Student", "Staff", "Teacher"],
      required: true,
    },

    // Attendance Status
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave", "Holiday", "Late", "Excused"],
      required: true,
    },

    remarks: { type: String, maxlength: 200 },

    /* ================= STUDENT ONLY ================= */
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },

    /* ================= STAFF / TEACHER ONLY ================= */
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },

    /* ================= LEAVE / SELF ATTENDANCE ================= */
    appliedBy: {
      type: String,
      enum: ["Self", "Teacher", "Admin"],
      default: "Teacher",
    },

    isApproved: {
      type: Boolean,
      default: true, // students auto approved
    },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },

    /* ================= AUDIT ================= */
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
    markedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate attendance
attendanceSchema.index(
  { userId: 1, date: 1, session: 1 },
  { unique: true }
);

export const Attendance = mongoose.model("Attendance", attendanceSchema);
