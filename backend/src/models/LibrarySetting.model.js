import mongoose, { Schema } from "mongoose";
const librarySettingSchema = new Schema({
  maxBooksPerStudent: {
    type: Number,
    default: 3
  },
  maxDaysToReturn: {
    type: Number,
    default: 15
  },
  finePerDay: {
    type: Number,
    default: 5
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
});

export const LibrarySetting = mongoose.model("LibrarySetting", librarySettingSchema);
