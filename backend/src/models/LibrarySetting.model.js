import mongoose, { Schema } from "mongoose";

const librarySettingSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true },

  // Issue limits
  maxBooksPerStudent: { type: Number, default: 3 },
  maxBooksPerTeacher: { type: Number, default: 5 },
  maxBooksPerStaff:   { type: Number, default: 3 },

  // Return window
  maxDaysToReturnStudent: { type: Number, default: 15 },
  maxDaysToReturnTeacher: { type: Number, default: 30 },

  // Grace period before fine starts
  gracePeriodDays: { type: Number, default: 0 },

  // Fine rules
  finePerDay:       { type: Number, default: 5 },
  maxFinePerBook:   { type: Number, default: 500 },
  lostBookFine:     { type: Number, default: 500 },
  damagedBookFine:  { type: Number, default: 200 },

  // Feature toggles
  allowReservation:  { type: Boolean, default: true },
  autoMarkOverdue:   { type: Boolean, default: true },
  autoSendReminders: { type: Boolean, default: false },

  // Academic
  currentSessionLabel: { type: String, trim: true },

  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const LibrarySetting = mongoose.model("LibrarySetting", librarySettingSchema);
