import mongoose, { Schema } from "mongoose";

const sectionSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    schoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    capacity: {
      type: Number,
      default: 100,
    },

    classTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // Backward-compatible legacy field (kept to avoid breaking existing reads/writes)
    StudentEnrollmentId: [
      {
        type: Schema.Types.ObjectId,
        ref: "StudentEnrollment",
      },
    ],
    // Preferred naming for new code paths
    studentEnrollmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "StudentEnrollment",
      },
    ],
    // ✅ ADD SUBJECTS (VERY IMPORTANT)
    subjects: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: "Subject",
        },
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
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
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    }
  },
  { timestamps: true }
);

/* ========= INDEXES ========= */

// Same class me duplicate section na ho
sectionSchema.index(
  { schoolClassId: 1, academicYearId: 1, name: 1 },
  { unique: true }
);

// Fast queries
sectionSchema.index({ schoolId: 1, academicYearId: 1 });

export const Section =
  mongoose.models.Section || mongoose.model("Section", sectionSchema);