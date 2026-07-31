import mongoose, { Schema } from "mongoose";

const gradeBandSchema = new Schema({
  grade: { type: String, required: true, trim: true },
  minPercentage: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

// One doc per school. `grades` must always include a band with minPercentage 0 so every
// percentage 0-100 resolves to a grade — enforced in the controller, not here, since Mongoose
// array validators run per-element and can't easily see the whole array's shape.
const gradingScaleSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true },
  grades: {
    type: [gradeBandSchema],
    default: [
      { grade: "A", minPercentage: 85 },
      { grade: "B", minPercentage: 70 },
      { grade: "C", minPercentage: 50 },
      { grade: "Fail", minPercentage: 0 },
    ],
  },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const GradingScale = mongoose.model("GradingScale", gradingScaleSchema);
