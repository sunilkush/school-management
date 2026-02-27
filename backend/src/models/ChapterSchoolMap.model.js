import mongoose, { Schema } from "mongoose";

const chapterSchoolMapSchema = new Schema(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// prevent duplicate mapping
chapterSchoolMapSchema.index(
  { chapterId: 1, schoolId: 1 },
  { unique: true }
);

export default mongoose.model(
  "ChapterSchoolMap",
  chapterSchoolMapSchema
);