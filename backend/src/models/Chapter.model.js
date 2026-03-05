import mongoose, { Schema } from "mongoose";

const chapterSchema = new Schema(
  {
    /* ================= BASIC DETAILS ================= */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },

    chapterNo: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      trim: true,
    },

    /* ================= RELATIONS ================= */

    boardschoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "BoardClass",
      required: true,
      index: true,
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    /* ================= OWNERSHIP ================= */

    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },

    /* ================= STATUS ================= */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    /* ================= AUDIT ================= */

    createdByRole: {
      type: String,
      enum: ["Super Admin", "School Admin"],
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
  },
  { timestamps: true }
);

/* ================= VALIDATION ================= */

chapterSchema.pre("validate", function (next) {
  if (this.isGlobal) {
    this.schoolId = null;
    return next();
  }

  if (!this.isGlobal && !this.schoolId) {
    return next(new Error("School chapter must have schoolId"));
  }

  next();
});

/* ================= UNIQUE INDEX ================= */

chapterSchema.index(
  {
    chapterNo: 1,
    subjectId: 1,
    boardschoolClassId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isGlobal: true },
  }
);

chapterSchema.index(
  {
    chapterNo: 1,
    subjectId: 1,
    boardschoolClassId: 1,
    schoolId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isGlobal: false },
  }
);

export const Chapter = mongoose.model("Chapter", chapterSchema);