import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School", // must match the model name you used in school.model.js
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    type: {
      type: String,
      enum: ["fees", "students", "attendance", "performance", "custom"],
      required: [true, "Report type is required"],
    },
    filtersApplied: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // flexible JSON or any data
      required: [true, "Report data is required"],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "finalized",
    },
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);


