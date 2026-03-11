import mongoose, { Schema } from "mongoose";

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    code: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isGlobal: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
  },
  { timestamps: true }
);

classSchema.index({ name: 1 }, { unique: true, sparse: true });
// ✅ Safe model registration (avoids overwrite errors)
export const Class = mongoose.models.Class || mongoose.model("Class", classSchema);


