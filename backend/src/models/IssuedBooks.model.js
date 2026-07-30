import mongoose, { Schema } from "mongoose";

const issuedBookSchema = new Schema({
  bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },

  // Primary borrower reference — kept as studentId for backward-compat,
  // but may hold a Student OR User _id depending on memberType
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },

  // Unified borrower (User _id) — makes it easy to support Teachers/Staff
  issuedToUserId: { type: Schema.Types.ObjectId, ref: "User" },

  memberType: {
    type: String,
    enum: ["Student", "Teacher", "Staff"],
    default: "Student",
  },

  issueDate: { type: Date, default: Date.now },
  dueDate:   { type: Date },
  returnDate:{ type: Date },

  status: {
    type: String,
    enum: ["Issued", "Returned", "Overdue", "Lost", "Damaged"],
    default: "Issued",
  },

  // Fine tracking
  fine:       { type: Number, default: 0 },
  fineStatus: { type: String, enum: ["Pending", "Paid", "Waived"], default: "Pending" },
  fineNote:   { type: String, trim: true },

  issuedBy: { type: Schema.Types.ObjectId, ref: "User" },

  schoolId:      { type: Schema.Types.ObjectId, ref: "School", required: true },
  academicYearId:{ type: Schema.Types.ObjectId, ref: "AcademicYear" },
}, { timestamps: true });

issuedBookSchema.index({ schoolId: 1, status: 1 });
issuedBookSchema.index({ bookId: 1 });
issuedBookSchema.index({ studentId: 1 });

export const IssuedBook = mongoose.model("IssuedBook", issuedBookSchema);
