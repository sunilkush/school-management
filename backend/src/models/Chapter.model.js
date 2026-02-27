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

    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
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

/* ================= VALIDATION GUARD ================= */

// Prevent wrong combinations
chapterSchema.pre("validate", function (next) {
  // ✅ Global chapter must NOT have school
  if (this.isGlobal) {
    this.schoolId = null;
    return next();
  }

  // ✅ Non-global MUST have school
  if (!this.isGlobal && !this.schoolId) {
    return next(new Error("School chapter must have schoolId"));
  }

  next();
});
/* ================= UNIQUE INDEX ================= */

// Global uniqueness
chapterSchema.index(
  {
    chapterNo: 1,
    classId: 1,
    subjectId: 1,
    boardId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isGlobal: true },
  }
);

// School uniqueness
chapterSchema.index(
  {
    chapterNo: 1,
    classId: 1,
    subjectId: 1,
    schoolId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isGlobal: false },
  }
);

/* ================= MODEL ================= */

const Chapter = mongoose.models.Chapter || mongoose.model("Chapter", chapterSchema);

export default Chapter;