import mongoose, { Schema } from "mongoose";

const classSectionSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: function () {
        // ✅ Only required if NOT global
        return !this.isGlobal;
      },
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: function () {
        // ✅ Only required if NOT global
        return !this.isGlobal;
      },
      index: true,
    },

    // ✅ If mapping is global (used by all schools)
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Optional: Section in-charge / Class teacher
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Subjects mapped to this class-section with assigned teachers
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
      },
    ],

    // Students mapped specifically to this Class-Section
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// 🔑 Unique mapping
classSectionSchema.index(
  {
    classId: 1,
    sectionId: 1,
    academicYearId: 1,
    schoolId: 1,
    isGlobal: 1,
  },
  { unique: true }
);

// 🔎 Faster lookups
classSectionSchema.index({ schoolId: 1, academicYearId: 1, isGlobal: 1 });


export const ClassSection = mongoose.model("ClassSection", classSectionSchema);
