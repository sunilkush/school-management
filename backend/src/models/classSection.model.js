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
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },

    // Optional: assign a section in-charge or class teacher
    classTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Students mapped specifically to this Class-Section
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
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

// 🔑 Prevent duplicate class-section mapping per school + academic year
classSectionSchema.index(
  { classId: 1, sectionId: 1, academicYearId: 1, schoolId: 1 },
  { unique: true }
);

// 🔎 For faster lookups
classSectionSchema.index({ schoolId: 1, academicYearId: 1 });

export const ClassSection = mongoose.model("ClassSection", classSectionSchema);
