// models/SchoolBoard.js

import mongoose, { Schema } from "mongoose";

const schoolBoardSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    // Who assigned board to school
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedByRole: {
      type: String,
      enum: ["Super Admin", "School Admin"],
      default: "Super Admin",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate board for same school
schoolBoardSchema.index(
  { schoolId: 1, boardId: 1 },
  { unique: true }
);

export const SchoolBoard =
  mongoose.models.SchoolBoard ||
  mongoose.model("SchoolBoard", schoolBoardSchema);

 