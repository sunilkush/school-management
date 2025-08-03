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
    },
    isActive: {
      type: Boolean,
      default: false,
    },
   
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
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



export const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);
