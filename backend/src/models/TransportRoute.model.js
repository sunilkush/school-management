import mongoose, { Schema } from "mongoose";

/**
 * One stop on a route, placed on the map.
 *
 * `radiusMeters` is how close the bus has to get before it counts as having arrived. It is
 * per-stop rather than one global constant because a stop on a wide arterial road needs a much
 * looser circle than one in a narrow lane, and a circle that is too tight simply never fires.
 */
const stopPointSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sequence: { type: Number, required: true, min: 0 },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    radiusMeters: { type: Number, default: 150, min: 20, max: 2000 },
    // Minutes after the trip starts that the bus is expected here. Used to say "running late",
    // which is the thing a waiting parent actually wants to know.
    expectedOffsetMin: { type: Number, default: null },
  },
  { _id: false }
);

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
    // Legacy display list, kept because existing routes and screens use it. It is DERIVED from
    // stopPoints whenever those are supplied, so there is still one source of truth.
    stops: {
      type: [String],
      default: [],
    },
    // Stops with coordinates. Live tracking cannot say "the bus reached your stop" without
    // these — a route that only has the string list above simply has no arrival detection
    // until someone puts it on the map, and the API says so rather than pretending.
    stopPoints: {
      type: [stopPointSchema],
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
