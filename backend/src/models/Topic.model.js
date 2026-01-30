import mongoose, { Schema } from "mongoose";

const topicSchema = new Schema(
  {
    /* ================= BASIC DETAILS ================= */

    name: {
      type: String,
      required: true,
      trim: true
      // Example: "Linear Equations", "Photosynthesis"
    },

    topicNo: {
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

    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
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
      // true → CBSE / ICSE global syllabus
      // false → School specific customization
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
 School + AcademicYear + Chapter
 me same topicNo repeat nahi hoga
*/
topicSchema.index(
  {
    topicNo: 1,
    chapterId: 1,
    schoolId: 1,
    academicYearId: 1
  },
  { unique: true, sparse: true }
);

/*
 Fast filtering for Question Bank & syllabus UI
*/
topicSchema.index({
  boardId: 1,
  classId: 1,
  subjectId: 1,
  chapterId: 1,
  academicYearId: 1,
  schoolId: 1
});

/* ✅ Safe model export */
const Topic =
  mongoose.models.Topic || mongoose.model("Topic", topicSchema);

export default Topic;
