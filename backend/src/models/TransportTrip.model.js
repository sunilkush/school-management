import mongoose, { Schema } from "mongoose";

/**
 * One run of one route — the morning pickup or the afternoon drop, on one day.
 *
 * Live tracking needs this because "where is the bus" is only a meaningful question while a bus
 * is actually running. Without a trip, yesterday's last known position would keep answering
 * today's question, which is worse than answering "not running" — a parent would walk their
 * child to a stop on the strength of a stale dot.
 *
 * It is also what makes the trail searchable afterwards: every location ping belongs to a trip,
 * so "show me what route 4 actually did last Tuesday morning" is one query.
 */

const locationSchema = new Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    speedKph: { type: Number, default: null, min: 0 },
    headingDeg: { type: Number, default: null, min: 0, max: 360 },
    recordedAt: { type: Date, required: true },
  },
  { _id: false }
);

const stopArrivalSchema = new Schema(
  {
    name: { type: String, required: true },
    sequence: { type: Number, required: true },
    arrivedAt: { type: Date, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    // How far off the expected time this was, positive meaning late. Null when the route did not
    // declare an expected offset for the stop.
    delayMin: { type: Number, default: null },
  },
  { _id: false }
);

const transportTripSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null },
    routeId: { type: Schema.Types.ObjectId, ref: "TransportRoute", required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Transport", required: true, index: true },
    // Whoever is driving this run — not necessarily the vehicle's usual driver.
    driverId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // Midnight of the day the trip runs, so a day's trips group cleanly regardless of start time.
    serviceDate: { type: Date, required: true },
    direction: { type: String, enum: ["pickup", "drop"], required: true },

    status: { type: String, enum: ["running", "completed", "cancelled"], default: "running", index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },

    lastLocation: { type: locationSchema, default: null },
    stopArrivals: { type: [stopArrivalSchema], default: [] },

    // Cheap health signal: a trip that is "running" with no pings is a driver who forgot to
    // enable location, which looks identical to a bus that has not moved.
    pingCount: { type: Number, default: 0 },

    startedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    endedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// One live-or-finished trip per route, per direction, per day. Without this a second driver
// starting the same run would split the trail across two documents, and "where is the bus" would
// have two different answers. Cancelled trips are excluded so a mistake can be redone.
transportTripSchema.index(
  { schoolId: 1, routeId: 1, serviceDate: 1, direction: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["running", "completed"] } } }
);
transportTripSchema.index({ schoolId: 1, status: 1, serviceDate: -1 });

export const TransportTrip =
  mongoose.models.TransportTrip || mongoose.model("TransportTrip", transportTripSchema);
