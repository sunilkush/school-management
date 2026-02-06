import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema(
  {
    academicYearId: 
        { type: mongoose.Schema.Types.ObjectId, 
          ref: "AcademicYear",
          required: true,
         },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true, trim: true },

    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
   /*  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" }, */
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },

    examType: { type: String, enum: ["objective", "subjective", "mixed"], default: "objective" },

    startTime: { type: Date, required: true },
    examDate:{ type:Date,required: true},
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },

    totalMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },

    questionOrder: { type: String, enum: ["fixed", "random"], default: "random" },
    shuffleOptions: { type: Boolean, default: true },

    questions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        snapshot: mongoose.Schema.Types.Mixed, // snapshot for immutability
        marks: { type: Number, default: 0, min: 0 }
      }
    ],

    settings: {
      negativeMarking: { type: Number, default: 0 },
      allowPartialScoring: { type: Boolean, default: false },
      maxAttempts: { type: Number, default: 1 }
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published", "completed"], default: "draft" }
  },
  { timestamps: true }
);

// Validation hooks
ExamSchema.pre("validate", function (next) {
  if (this.endTime && this.startTime && this.endTime <= this.startTime) {
    return next(new Error("End time must be after start time."));
  }
  if (this.passingMarks > this.totalMarks) {
    return next(new Error("Passing marks cannot exceed total marks."));
  }
  next();
});

export const Exam = mongoose.model("Exam", ExamSchema);

//
// Exam Attempt Schema (tracks each student’s attempt)
//
const ExamAttemptSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },

    attemptNumber: { type: Number, default: 1 }, // in case multiple attempts are allowed
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },

    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
        response: mongoose.Schema.Types.Mixed, // could be option keys, text, or match pairs
        isCorrect: { type: Boolean },
        marksObtained: { type: Number, default: 0 }
      }
    ],

    totalObtainedMarks: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ["in_progress", "submitted", "evaluated"], 
      default: "in_progress" 
    },

    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // for subjective/manual checking
  },
  { timestamps: true }
);

export const ExamAttempt = mongoose.model("ExamAttempt", ExamAttemptSchema);
