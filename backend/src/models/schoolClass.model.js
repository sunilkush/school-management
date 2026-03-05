import mongoose, { Schema } from "mongoose";

const schoolClassSchema = new Schema(
  {
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

    boardClassId: {
      type: Schema.Types.ObjectId,
      ref: "BoardClass",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

schoolClassSchema.index(
  { schoolId: 1, academicYearId: 1, boardschoolClassId: 1 },
  { unique: true }
);

export const SchoolClass =
  mongoose.models.SchoolClass ||
  mongoose.model("SchoolClass", schoolClassSchema);