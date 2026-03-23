import mongoose, { Schema } from "mongoose";
const issuedBookSchema = new Schema({
  bookId: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  returnDate: { type: Date },
  status: {
    type: String,
    enum: ["Issued", "Returned", "Overdue"],
    default: "Issued",
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  academicYearId: {
    type: Schema.Types.ObjectId,
    ref: "AcademicYear",
  },
}, { timestamps: true });

export const IssuedBook = mongoose.model("IssuedBook", issuedBookSchema);
