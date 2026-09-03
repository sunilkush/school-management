import mongoose, { Schema } from "mongoose";

/**
 * The breadcrumb trail — one row per accepted location ping.
 *
 * Kept separate from TransportTrip on purpose. A bus pinging every ten seconds produces on the
 * order of 8,000 rows per bus per day; growing that inside the trip document would push it toward
 * Mongo's 16 MB limit and make every "where is the bus now" read drag the whole day's history
 * along with it. The trip carries only the latest fix; the history lives here.
 *
 * Rows expire automatically. A school needs the trail to answer "what happened on the way home
 * yesterday", not to keep a year of minute-by-minute movements of identifiable children — and
 * nobody is going to remember to prune this by hand.
 */

const TRAIL_RETENTION_DAYS = 14;

const vehicleLocationSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: "TransportTrip", required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Transport", required: true },

    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    speedKph: { type: Number, default: null, min: 0 },
    headingDeg: { type: Number, default: null, min: 0, max: 360 },
    // Device time when the fix was taken, which is not the same as when it reached the server —
    // a driver going through a tunnel uploads a batch of older fixes on the way out.
    recordedAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false }
);

vehicleLocationSchema.index({ tripId: 1, recordedAt: 1 });
vehicleLocationSchema.index(
  { recordedAt: 1 },
  { expireAfterSeconds: TRAIL_RETENTION_DAYS * 24 * 60 * 60 }
);

export { TRAIL_RETENTION_DAYS };
export const VehicleLocation =
  mongoose.models.VehicleLocation || mongoose.model("VehicleLocation", vehicleLocationSchema);
