import mongoose, { Schema } from "mongoose";

const subjectSchema = new Schema(
  {
    /* ================= BASIC ================= */

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
    },

    shortName: {
      type: String,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    /* ================= CURRICULUM ================= */

    boardschoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "BoardClass",
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: ["Core", "Elective", "Language", "Practical", "Optional"],
      default: "Core",
    },

    type: {
      type: String,
      enum: ["Theory", "Practical", "Both"],
      default: "Theory",
    },

    /* ================= EXAM CONFIG ================= */

    maxMarks: {
      type: Number,
      default: 100,
      min: 1,
    },

    passMarks: {
      type: Number,
      default: 33,
      min: 0,
      validate(v) {
        return v <= this.maxMarks;
      },
    },

    /* ================= STATUS ================= */

    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    /* ================= AUDIT ================= */

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

subjectSchema.index(
  { name: 1, boardschoolClassId: 1 },
  { unique: true }
);

/* ================= AUTO SHORT NAME ================= */

subjectSchema.pre("save", function (next) {
  if (!this.shortName && this.name) {
    this.shortName = this.name.substring(0, 4).toUpperCase();
  }

  if (!this.code && this.name) {
    const prefix = this.name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    this.code = `${prefix}${randomNum}`;
  }

  next();
});

/* ================= SAFE EXPORT ================= */

export const Subject =
  mongoose.models.Subject ||
  mongoose.model("Subject", subjectSchema);