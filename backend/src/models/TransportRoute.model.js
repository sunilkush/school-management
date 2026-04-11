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
      ref: "AcademicYears",
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

export const TransportRoute = mongoose.model("TransportRoute", transportRouteSchema);
