import mongoose, { Schema } from "mongoose";

const sectionSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    schoolschoolClassId: {
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
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
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
  },
  { timestamps: true }
);

/* ========= INDEXES ========= */

// Same class me duplicate section na ho
sectionSchema.index(
  { schoolschoolClassId: 1, name: 1 },
  { unique: true }
);

// Fast queries
sectionSchema.index({ schoolId: 1, academicYearId: 1 });

export const Section =
  mongoose.models.Section || mongoose.model("Section", sectionSchema);