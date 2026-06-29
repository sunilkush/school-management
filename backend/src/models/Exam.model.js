import mongoose, { Schema } from "mongoose";

/* ================================
            EXAM SCHEMA
================================ */

const examSchema = new Schema(
  {
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    examCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },

    schoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      default: null,
      index: true
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true
    },

    examType: {
      type: String
    },

    examDate: {
      type: Date,
      required: true,
      index: true
    },

    startTime: {
      type: Date,
      required: true
    },

    endTime: {
      type: Date,
      required: true
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1
    },

    passingMarks: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.totalMarks;
        },
        message: "Passing marks cannot exceed total marks"
      }
    },

    questionOrder: {
      type: String,
      enum: ["fixed", "random"],
      default: "random"
    },

    shuffleOptions: {
      type: Boolean,
      default: true
    },

    questions: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question"
        },

        snapshot: Schema.Types.Mixed, // immutable snapshot

        marks: {
          type: Number,
          default: 0,
          min: 0
        }
      }
    ],

    settings: {
      negativeMarking: { type: Number, default: 0 },
      allowPartialScoring: { type: Boolean, default: false },
      maxAttempts: { type: Number, default: 1 }
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["draft", "published", "completed"],
      default: "draft"
    }
  },
  { timestamps: true }
);

/* ================================
          VALIDATION HOOK
================================ */

examSchema.pre("validate", function (next) {
  if (this.endTime <= this.startTime) {
    return next(new Error("End time must be after start time"));
  }
  next();
});

/* ================================
              INDEXES
================================ */

examSchema.index({
  schoolId: 1,
  academicYearId: 1,
  schoolClassId: 1,
  subjectId: 1
});

examSchema.index({ schoolId: 1, title: 1 });
examSchema.index({ schoolId: 1, examDate: -1, totalMarks: -1 });

export const Exam =
  mongoose.models.Exam || mongoose.model("Exam", examSchema);
