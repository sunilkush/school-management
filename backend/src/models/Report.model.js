import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Student', 'Attendance', 'Exam', 'Fees', 'Custom'],
    required: true,
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  academicYearId: {
    type: Schema.Types.ObjectId,
    ref: "AcademicYear",
    required: true,
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
  },
  generatedData: {
    type: Schema.Types.Mixed, // JSON result of the report
    default: {},
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export const Report = mongoose.model("Report", reportSchema);
