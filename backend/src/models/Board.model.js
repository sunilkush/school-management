import mongoose, { Schema } from "mongoose";

const boardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true, // ✅ yahi rakh do, alag index ki zarurat nahi
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },

    description: { type: String, trim: true },

    createdByRole: {
      type: String,
      enum: ["Super Admin"],
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

    isActive: {
      type: Boolean,
      default: true,
    },

    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

// ❌ REMOVE THIS (duplicate unique)
// boardSchema.index({ name: 1 }, { unique: true });

// ===============================
// ✅ Auto Generate Unique Code
// ===============================
boardSchema.pre("save", async function (next) {
  if (!this.code && this.name) {
    const prefix = this.name.replace(/\s+/g, "").substring(0, 4).toUpperCase();

    let isUnique = false;
    let newCode;

    while (!isUnique) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      newCode = `${prefix}${randomNum}`;

      const exists = await mongoose.models.Board.findOne({ code: newCode });
      if (!exists) isUnique = true;
    }

    this.code = newCode;
  }

  next();
});

const Board = mongoose.models.Board || mongoose.model("Board", boardSchema);
export default Board;