import mongoose, { Schema } from "mongoose";

const TransportSchema = new Schema(
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
    vehicleType: {
      type: String,
      default: "Bus",
      trim: true,
    },
    busNumber: {
      type: String,
      required: true,
      trim: true,
    },
    route: {
      type: String,
      default: "",
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional link to a real "Driver" role User account, so that user can see their own
    // assigned vehicle on their dashboard. driverName stays the source of truth for display —
    // this is only set when the vehicle is linked to an actual login-capable driver account.
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    driverContact: {
      type: String,
      default: "NA",
      trim: true,
    },
    drivingLicense: {
      type: String,
      default: "NA",
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["In Use", "Available", "Maintenance"],
      default: "Available",
    },
  },
  { timestamps: true }
);

export const Transport = mongoose.model("Transport", TransportSchema);