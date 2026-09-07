import mongoose, { Schema } from "mongoose";

/**
 * One round of staff appraisals — "Annual Review 2025-26" — and the criteria it is scored on.
 *
 * The criteria live on the CYCLE, not on each review. Everyone in a round has to be measured
 * against the same things or the scores cannot be compared, which is the entire reason a school
 * runs an appraisal round rather than collecting opinions. It also means a school can change what
 * it values next year without rewriting last year's reviews.
 */

export const CYCLE_STATUSES = ["draft", "open", "closed"];

const criterionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 500 },
    /** Relative importance. The cycle validates that these add up to 100. */
    weight: { type: Number, required: true, min: 1, max: 100 },
  },
  { _id: false }
);

const appraisalCycleSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    criteria: { type: [criterionSchema], default: [] },

    /** Whether staff score themselves first. Some schools want it, some find it a waste of time. */
    selfAssessmentRequired: { type: Boolean, default: true },

    status: { type: String, enum: CYCLE_STATUSES, default: "draft", index: true },
    closedAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

appraisalCycleSchema.index({ schoolId: 1, status: 1 });

appraisalCycleSchema.pre("validate", function checkCycle(next) {
  if (this.periodEnd && this.periodStart && this.periodEnd <= this.periodStart) {
    return next(new Error("The review period must end after it starts"));
  }

  // Weights are only meaningful relative to each other, and a cycle whose weights do not add up
  // produces overall scores that cannot be compared between staff — which is the one thing an
  // appraisal round is for. A draft is allowed to be half-built; opening it is not.
  if (this.status !== "draft" && this.criteria?.length) {
    const total = this.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (total !== 100) {
      return next(new Error(`Criteria weights must add up to 100 — they currently add up to ${total}`));
    }
  }
  if (this.status !== "draft" && !this.criteria?.length) {
    return next(new Error("A cycle needs at least one criterion before it can be opened"));
  }
  return next();
});

export const AppraisalCycle =
  mongoose.models.AppraisalCycle || mongoose.model("AppraisalCycle", appraisalCycleSchema);
