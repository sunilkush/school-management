// models/Board.js
import mongoose, { Schema } from "mongoose";

const boardSchema = new Schema(
  {
    // 🔹 Basic Details
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true, // prevent null duplicate issue
    },

    description: { type: String, trim: true },

    // 🔹 Ownership
    createdByRole: {
      type: String,
      enum: ["Super Admin", "School Admin"], // Future safe
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // 🔹 Status
    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

// ✅ Unique Index (Only Once)
boardSchema.index({ name: 1 }, { unique: true });

// ===============================
// ✅ Sync Status & isActive
// ===============================
boardSchema.pre("save", function (next) {
  if (this.isActive) {
    this.status = "Active";
  } else {
    this.status = "Inactive";
  }
  next();
});

// ===============================
// ✅ Auto Generate Unique Code
// ===============================
boardSchema.pre("save", async function (next) {
  if (!this.code && this.name) {
    const prefix = this.name.replace(/\s+/g, "").substring(0, 4).toUpperCase();

    let isUnique = false;
    let newCode;

    while (!isUnique) {
      const randomNum = Math.floor(100 + Math.random() * 9000);
      newCode = `${prefix}${randomNum}`;

      const exists = await mongoose.models.Board.findOne({ code: newCode });
      if (!exists) isUnique = true;
    }

    this.code = newCode;
  }

  next();
});

// ===============================
// ✅ Safe Model Export
// ===============================
const Board = mongoose.models.Board || mongoose.model("Board", boardSchema);
export default Board;
