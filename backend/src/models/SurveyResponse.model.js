import mongoose, { Schema } from "mongoose";

/**
 * The answers somebody gave.
 *
 * On an anonymous survey `respondentId` is simply not set — the answers exist with nothing
 * pointing back at a person, which is the only way "anonymous" can mean anything. Whether somebody
 * has replied is tracked in SurveyParticipation instead, a separate collection with no answers in
 * it, so the school can still chase the people who have not without being able to join the two.
 *
 * The honest limit of that, worth saying out loud: if a survey goes to three people and two have
 * replied, the school can work out who the third response belongs to when it arrives. Anonymity
 * here protects a respondent in a crowd, not one in a group of three.
 */

const answerSchema = new Schema(
  {
    /** Matches Survey.questions[].key — never a position, so reordering cannot re-point an answer. */
    questionKey: { type: String, required: true, trim: true },
    /** Shape depends on the question type: a number, a string, or an array for multi-choice. */
    value: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const surveyResponseSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true, index: true },

    /** Null on an anonymous survey, and deliberately so. */
    respondentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    respondentRole: { type: String, trim: true, default: "" },

    answers: { type: [answerSchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Only meaningful on a named survey; an anonymous one has no respondent to be unique on, so the
// index is partial rather than blocking every anonymous response after the first.
surveyResponseSchema.index(
  { surveyId: 1, respondentId: 1 },
  { unique: true, partialFilterExpression: { respondentId: { $type: "objectId" } } }
);
surveyResponseSchema.index({ schoolId: 1, surveyId: 1, submittedAt: -1 });

export const SurveyResponse =
  mongoose.models.SurveyResponse || mongoose.model("SurveyResponse", surveyResponseSchema);
