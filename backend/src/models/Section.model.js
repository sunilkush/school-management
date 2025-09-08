import mongoose, { Schema } from "mongoose";

const sectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // avoid duplicates like "A" vs "a"
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

    // Optional: section teacher (if school assigns section in-charge)
    sectionTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Students enrolled directly in this section (optional)
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Link to Class (if needed to separate class & section logic)
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
    },

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

// 🔑 Prevent duplicate section names inside same school + academic year + class
sectionSchema.index(
  { name: 1, schoolId: 1, academicYearId: 1, classId: 1 },
  { unique: true }
);

// 🔎 For faster search
sectionSchema.index({ schoolId: 1, academicYearId: 1 });

export const Section = mongoose.model("Section", sectionSchema);
