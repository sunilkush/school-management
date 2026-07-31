import mongoose, { Schema } from "mongoose";

const bookSchema = new Schema({
  title:    { type: String, required: true, trim: true, lowercase: true },
  author:   { type: String, required: true, trim: true, lowercase: true },
  publisher:{ type: String, required: true, trim: true, lowercase: true },
  isbn:     { type: String, trim: true },

  category:      { type: String, required: true, trim: true, lowercase: true },
  description:   { type: String, trim: true },
  language:      { type: String, trim: true, default: "English" },
  edition:       { type: String, trim: true },
  tags:          [{ type: String, trim: true, lowercase: true }],
  coverImage:    { type: String, trim: true },

  totalCopies:    { type: Number, default: 1, min: 0 },
  availableCopies:{ type: Number, default: 1, min: 0 },

  shelfLocation: { type: String, required: true, trim: true },
  rackNumber:    { type: String, trim: true },

  schoolId:      { type: Schema.Types.ObjectId, ref: "School", required: true },
  academicYearId:{ type: Schema.Types.ObjectId, ref: "AcademicYear" },
  addedBy:       { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

bookSchema.index({ schoolId: 1, category: 1 });
// ISBN uniqueness is per-school, not global — two different schools cataloguing the same
// real-world book (identical ISBN) is normal, not a duplicate. Partial filter skips the check
// for books with no ISBN (local/handwritten titles) instead of colliding on missing/empty values.
bookSchema.index(
  // $ne isn't allowed in a partial index filter — $gt: "" achieves the same "non-empty string"
  // exclusion, since "" sorts lower than every other string.
  { schoolId: 1, isbn: 1 },
  { unique: true, partialFilterExpression: { isbn: { $type: "string", $gt: "" } } }
);
bookSchema.index({ title: "text", author: "text", isbn: 1 });

export const Book = mongoose.model("Book", bookSchema);
