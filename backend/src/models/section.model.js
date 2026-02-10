import mongoose, { Schema } from "mongoose";

const sectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    sectionTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
    },
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

sectionSchema.index(
  { name: 1, schoolId: 1, academicYearId: 1, classId: 1 },
  { unique: true }
);

sectionSchema.index({ schoolId: 1, academicYearId: 1 });

// ✅ Check if model already exists
export const Section = mongoose.model("Section", sectionSchema);
