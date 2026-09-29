import mongoose, { Schema } from "mongoose";

// A named running number, advanced with one atomic $inc. Used where a sequence must never hand the
// same value out twice (reading the highest existing number and adding one does, when two requests
// run at once).
const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

export const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);
