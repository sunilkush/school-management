import mongoose, { Schema } from "mongoose";

const topicSchema = new Schema(
  {
    /* ================= BASIC DETAILS ================= */

    name: {
      type: String,
      required: true,
      trim: true
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

    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true
    },


    /* ================= OWNERSHIP ================= */

    isGlobal: {
      type: Boolean,
      default: false
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
    }
  },
  { timestamps: true }
);

/* ================= INDEX ================= */

topicSchema.index(
  {
    topicNo: 1,
    chapterId: 1,
    schoolId: 1,
    academicYearId: 1
  },
  { unique: true, sparse: true }
);

const Topic = mongoose.models.Topic || mongoose.model("Topic", topicSchema);

export default Topic;