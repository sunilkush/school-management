import mongoose, { Schema } from "mongoose";

const boardClassSchema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },

    schoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    description: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

boardClassSchema.index(
  { boardId: 1, schoolClassId: 1 },
  { unique: true }
);

/* ================= VIRTUAL ================= */

boardClassSchema.virtual("fullName").get(function () {
  return `${this.displayName || ""}`;
});

/* ================= SAFE EXPORT ================= */

export const BoardClass =
  mongoose.models.BoardClass ||
  mongoose.model("BoardClass", boardClassSchema);