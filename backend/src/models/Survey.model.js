import mongoose, { Schema } from "mongoose";

/**
 * A questionnaire the school sends to a group of people.
 *
 * The reason to have this rather than a link to a free form builder is the roster: "the parents of
 * Class 8" is one choice here and a spreadsheet exercise anywhere else, the school can see who has
 * not replied, and teacher feedback does not leave the school's own database.
 */

export const QUESTION_TYPES = ["rating", "single_choice", "multi_choice", "yes_no", "short_text", "long_text", "number"];
export const SURVEY_STATUSES = ["draft", "open", "closed"];

const questionSchema = new Schema(
  {
    /** Stable within the survey — responses are stored against this, not against a position, so
     *  reordering questions later could never re-point an answer at a different question. */
    key: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    /** For the choice types. Ignored by the others. */
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
    helpText: { type: String, trim: true, default: "", maxlength: 300 },
  },
  { _id: false }
);

const surveySchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    questions: { type: [questionSchema], default: [] },

    /** Same shape as a circular's audience, and resolved by the same code. */
    audience: {
      roles: { type: [String], default: [] },
      schoolClassIds: { type: [Schema.Types.ObjectId], ref: "SchoolClass", default: [] },
      sectionIds: { type: [Schema.Types.ObjectId], ref: "Section", default: [] },
      userIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    },

    /**
     * Anonymous responses carry no respondent at all — see SurveyResponse. Who has replied is
     * still tracked, separately, so the school can chase the people who have not.
     *
     * Fixed once the survey opens. Turning it off afterwards would retroactively expose answers
     * given on the understanding that they were anonymous, and turning it on would not un-name
     * the ones already collected.
     */
    isAnonymous: { type: Boolean, default: false },

    recipients: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    recipientCount: { type: Number, default: 0 },

    opensAt: { type: Date, default: null },
    closesAt: { type: Date, default: null },

    status: { type: String, enum: SURVEY_STATUSES, default: "draft", index: true },
    openedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

surveySchema.index({ schoolId: 1, status: 1, createdAt: -1 });
surveySchema.index({ schoolId: 1, recipients: 1, status: 1 });

surveySchema.pre("validate", function checkSurvey(next) {
  if (this.status !== "draft" && !this.questions?.length) {
    return next(new Error("A survey needs at least one question before it can be opened"));
  }

  const keys = new Set();
  for (const q of this.questions || []) {
    if (keys.has(q.key)) return next(new Error(`Two questions share the key "${q.key}"`));
    keys.add(q.key);

    // A choice question with nothing to choose from is a dead end nobody can answer, and it is
    // only noticed once it is in front of two hundred parents.
    if (["single_choice", "multi_choice"].includes(q.type) && q.options.length < 2) {
      return next(new Error(`"${q.text}" is a choice question and needs at least two options`));
    }
  }

  if (this.opensAt && this.closesAt && this.closesAt <= this.opensAt) {
    return next(new Error("The survey must close after it opens"));
  }
  return next();
});

/**
 * Once a survey is open its questions and its anonymity are fixed.
 *
 * Answers are stored against question keys. Changing the questions afterwards would leave
 * responses pointing at questions that no longer exist, or worse, at ones that now ask something
 * different — and every summary built from them would be quietly wrong.
 */
surveySchema.post("init", function captureStatus() {
  this.$locals.originalStatus = this.status;
});

surveySchema.pre("save", function blockOpenEdits(next) {
  if (this.isNew) return next();
  if (this.$locals.originalStatus === "draft") return next();

  const mutable = new Set(["status", "closedAt", "closesAt", "recipients", "recipientCount", "updatedAt"]);
  const touched = this.modifiedPaths().filter((path) => !mutable.has(path.split(".")[0]));
  if (touched.length) {
    return next(new Error("An open survey's questions cannot be changed — close it and run a new one"));
  }
  return next();
});

export const Survey = mongoose.models.Survey || mongoose.model("Survey", surveySchema);
