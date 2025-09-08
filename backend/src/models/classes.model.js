import mongoose, { Schema } from "mongoose";

const classSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true, // faster queries by school
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // Example: "CLASS 6"
    },

    // Sections linked with this class (10-A, 10-B, etc.)
    sections: [
      {
        type: Schema.Types.ObjectId,
        ref: "Section",
      },
    ],

    // Main Class Teacher (Homeroom teacher)
    classTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Enrolled Students
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Subjects taught in this class
    subjects: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        periodPerWeek: {
          type: Number,
          default: 0, // timetable planning
        },
        isCompulsory: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// 🔑 Prevent duplicate class name within a school + academic year
classSchema.index(
  { name: 1, schoolId: 1, academicYearId: 1 },
  { unique: true }
);

// 🔎 For faster lookups
classSchema.index({ schoolId: 1, academicYearId: 1 });

export const Class = mongoose.model("Class", classSchema);
