import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema(
  {
    examId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Exam", 
      required: true 
    },
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    durationSeconds: { type: Number, min: 0 },

    status: { 
      type: String, 
      enum: ["in_progress", "submitted", "evaluated", "abandoned"], 
      default: "in_progress" 
    },

    answers: [
      {
        questionRef: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        snapshot: mongoose.Schema.Types.Mixed, // immutable copy of the question
        answer: mongoose.Schema.Types.Mixed,   // e.g., ['A'], ['A','B'], "true", "Some text"
        marksObtained: { type: Number, default: 0, min: 0 },
        isCorrect: { type: Boolean, default: null },
        flagged: { type: Boolean, default: false }
      }
    ],

    totalMarksObtained: { type: Number, default: 0, min: 0 },
    grade: { type: String, trim: true },
    reviewComments: { type: String, trim: true }
  },
  { timestamps: true } // auto-manages createdAt & updatedAt
);

// ✅ Auto-calculate durationSeconds if submittedAt exists
AttemptSchema.pre("save", function (next) {
  if (this.submittedAt && this.startedAt) {
    this.durationSeconds = Math.floor(
      (this.submittedAt.getTime() - this.startedAt.getTime()) / 1000
    );
  }
  next();
});

export const Attempt = mongoose.model("Attempt", AttemptSchema);
