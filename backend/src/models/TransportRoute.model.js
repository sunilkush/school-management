import mongoose, { Schema } from "mongoose";

const transportRouteSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bus: {
      type: String,
      required: true,
      trim: true,
    },
    stops: {
      type: [String],
      default: [],
    },
    students: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

transportRouteSchema.index({ schoolId: 1, academicYearId: 1 });

export const TransportRoute = mongoose.model("TransportRoute", transportRouteSchema);
