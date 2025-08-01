import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Academic Year name is required"],
      trim: true,
      unique: false, // uniqueness should be handled at (name + school) level
    },
    code: {
      type: String,
      trim: true,
      unique: false, // e.g., AY2025
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "inactive",
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on name + school for duplicate protection
academicYearSchema.index({ name: 1, school: 1 }, { unique: true });

export const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);
