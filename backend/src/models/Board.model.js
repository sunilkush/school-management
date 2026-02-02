// models/Board.js
import mongoose, { Schema } from "mongoose";

const boardSchema = new Schema(
  {
    // school ID
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    // 🔹 Basic Details
    name: { type: String, required: true, trim: true, uppercase: true }, // CBSE, ICSE, State Board
    code: { type: String, trim: true, uppercase: true, unique: true }, // e.g., CBSE01
    description: { type: String, trim: true },

    // 🔹 Ownership / School Level
    createdByRole: {
      type: String,
      enum: ["Super Admin", "School Admin"],
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // 🔹 Status
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    remarks: { type: String, trim: true },
    schoolId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "School",
          required: true,
        },
  },
  { timestamps: true }
);

// ✅ Indexes for fast queries & uniqueness
boardSchema.index({ name: 1 }, { unique: true });
boardSchema.index({ code: 1 }, { unique: true });

// ✅ Auto-generate code if missing
boardSchema.pre("save", function (next) {
  if (!this.code && this.name) {
    const prefix = this.name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    this.code = `${prefix}${randomNum}`;
  }
  next();
});

// ✅ Safe model registration
const Board = mongoose.models.Board || mongoose.model("Board", boardSchema);
export default Board;
