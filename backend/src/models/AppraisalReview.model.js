import mongoose, { Schema } from "mongoose";

/**
 * One member of staff's appraisal within a cycle.
 *
 * Self-scores and reviewer scores are kept as two separate sets, never merged. The gap between
 * them is the useful part of an appraisal — a teacher who rates themselves 5 where their head of
 * department rates them 2 is the conversation the whole exercise exists to start. Overwriting one
 * with the other would throw that away.
 *
 * The overall score is stored, not computed on read. The cycle's weights can be edited while it is
 * a draft, and a review finalised under one set of weights must keep the number it was finalised
 * with — otherwise last year's ratings quietly change when somebody edits a template.
 */

export const REVIEW_STATUSES = ["pending", "self_submitted", "reviewed", "finalised"];

const scoreSchema = new Schema(
  {
    criterion: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "", maxlength: 1000 },
  },
  { _id: false }
);

const appraisalReviewSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: "AppraisalCycle", required: true, index: true },

    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    /** The employee's login, so they can open their own review without a lookup. */
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    selfScores: { type: [scoreSchema], default: [] },
    selfComment: { type: String, trim: true, default: "", maxlength: 2000 },
    selfSubmittedAt: { type: Date, default: null },

    reviewerScores: { type: [scoreSchema], default: [] },
    reviewerComment: { type: String, trim: true, default: "", maxlength: 2000 },
    reviewedAt: { type: Date, default: null },

    /** Weighted out of 5, from the reviewer's scores. Null until reviewed. */
    overallScore: { type: Number, default: null, min: 0, max: 5 },
    /** Plain-language band, so a school does not have to interpret a decimal. */
    overallBand: { type: String, trim: true, default: "" },

    /** Agreed next steps. The part staff actually remember. */
    goals: { type: [String], default: [] },

    status: { type: String, enum: REVIEW_STATUSES, default: "pending", index: true },
    finalisedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One review per person per cycle. A second would mean two different scores for the same round.
appraisalReviewSchema.index({ cycleId: 1, employeeId: 1 }, { unique: true });
appraisalReviewSchema.index({ schoolId: 1, status: 1 });

/**
 * A finalised review is frozen.
 *
 * Same reasoning as a posted journal entry: the number has been shown to the member of staff and
 * may already have been acted on. Changing it afterwards, silently, is how an appraisal process
 * stops being trusted.
 */
appraisalReviewSchema.post("init", function captureStatus() {
  this.$locals.originalStatus = this.status;
});

appraisalReviewSchema.pre("save", function blockFinalisedEdits(next) {
  if (this.isNew) return next();
  if (this.$locals.originalStatus !== "finalised") return next();
  if (this.modifiedPaths().length) {
    return next(new Error("A finalised appraisal cannot be changed — reopen the cycle if it is wrong"));
  }
  return next();
});

export const AppraisalReview =
  mongoose.models.AppraisalReview || mongoose.model("AppraisalReview", appraisalReviewSchema);
