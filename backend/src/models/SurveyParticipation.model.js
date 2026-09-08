import mongoose, { Schema } from "mongoose";

/**
 * A note that somebody has replied — and nothing else.
 *
 * This exists only so that an anonymous survey can still answer "who have we not heard from",
 * which is the question that makes a survey finishable. It holds no answers and never will: the
 * whole design rests on there being no way to join this to SurveyResponse.
 *
 * On a named survey it is redundant with the response itself, and it is still written, because a
 * single code path for "has this person replied" is worth more than the row it saves.
 */

const surveyParticipationSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    respondedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One per person per survey. Also what stops somebody answering an anonymous survey twice, since
// the response itself carries nothing to check against.
surveyParticipationSchema.index({ surveyId: 1, userId: 1 }, { unique: true });

export const SurveyParticipation =
  mongoose.models.SurveyParticipation ||
  mongoose.model("SurveyParticipation", surveyParticipationSchema);
