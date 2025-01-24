import mongoose, { Schema } from "mongoose";

const examinationSchema = new Schema({
  name: {
    type: String,
    required: true
  }, // e.g., "Mid-Term Exam"
  date: {
    type: Date,
    required: true
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  results: [
    {
      student: {
        type: Schema.Types.ObjectId,
        ref: "Student"
      },
      marksObtained: {
        type: Number,
        required: true
      },
      totalMarks: {
        type: Number,
        required: true
      },
      grade: { type: String },
    },
  ],
}, { timestamps: true });

export const Examination = mongoose.model("Examinations", examinationSchema)