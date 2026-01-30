import mongoose, { Schema } from "mongoose";

const chapterSchema = new Schema(
  {
    /* ================= BASIC DETAILS ================= */
    name: {
      type: String,
      required: true,
      trim: true
      // Example: "Algebra", "Crop Production"
    },

    chapterNo: {
      type: Number,
      required: true,
      min: 1
    },

    description: {
      type: String,
      trim: true
    },

    /* ================= RELATIONS ================= */

    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true
    },

    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true
    },

    /* ================= OWNERSHIP ================= */

    isGlobal: {
      type: Boolean,
      default: false
      // true → Super Admin (CBSE global syllabus)
      // false → School specific chapter
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true
    },

    /* ================= STATUS ================= */

    isActive: {
      type: Boolean,
      default: true
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },

    /* ================= AUDIT ================= */

    createdByRole: {
      type: String,
      enum: ["Super Admin", "School Admin"],
      required: true
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

/*
 Same:
 School + AcademicYear + Board + Class + Subject
 me same chapterNo repeat nahi hoga
*/
chapterSchema.index(
  {
    chapterNo: 1,
    classId: 1,
    subjectId: 1,
    schoolId: 1,
    academicYearId: 1
  },
  { unique: true, sparse: true }
);

/*
 Fast filtering for Question Bank & syllabus UI
*/
chapterSchema.index({
  boardId: 1,
  classId: 1,
  subjectId: 1,
  academicYearId: 1,
  schoolId: 1
});

/* ✅ Safe model export */
const Chapter =
  mongoose.models.Chapter || mongoose.model("Chapter", chapterSchema);

export default Chapter;
