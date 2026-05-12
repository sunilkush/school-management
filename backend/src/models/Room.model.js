import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: "" },
    capacity: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["classroom", "lab", "library", "auditorium", "sports", "other"],
      default: "classroom",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);
