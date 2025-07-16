import mongoose, { Schema } from "mongoose";
const issuedBookSchema = new Schema({
  bookId: {
    type: Schema.Types.ObjectId,
    ref: "Books",
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Students",
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
    ref: "Schools",
    required: true,
  },
  academicYearId: {
    type: Schema.Types.ObjectId,
    ref: "AcademicYears",
  },
}, { timestamps: true });

export const IssuedBook = mongoose.model("IssuedBook", issuedBookSchema);
