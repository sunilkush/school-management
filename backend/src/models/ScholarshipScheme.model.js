import mongoose, { Schema } from "mongoose";

/**
 * A named concession the school offers — "Staff Ward 50%", "Sibling 10%", "RTE Free Seat".
 *
 * What existed before this was `StudentEnrollment.feeDiscount`: a single anonymous percentage per
 * student with no name, no reason, no approver and no end date. That is enough to reduce a bill
 * and not enough to answer any question a management committee asks — how many merit
 * scholarships did we give, who approved this 50%, what is the total we waived this year.
 *
 * A scheme is the reusable definition. Granting it to a child is a ScholarshipAward.
 */

export const SCHEME_CATEGORIES = ["Merit", "Means", "Staff Ward", "Sibling", "RTE", "Sports", "Single Parent", "Other"];
export const DISCOUNT_TYPES = ["percent", "amount"];

const scholarshipSchemeSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null, index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    category: { type: String, enum: SCHEME_CATEGORIES, default: "Other" },
    description: { type: String, trim: true, default: "", maxlength: 1000 },

    discountType: { type: String, enum: DISCOUNT_TYPES, default: "percent" },
    /** A percentage of the fee, or a flat rupee figure, depending on discountType. */
    value: { type: Number, required: true, min: 0 },

    /**
     * Which fee heads it covers. Empty means the whole bill.
     *
     * This is the part a flat per-student percentage could never express: a transport concession
     * should come off the transport fee and nothing else, and applying it to tuition as well is
     * not a rounding difference — it is the school giving away money it did not mean to.
     */
    feeHeadIds: { type: [Schema.Types.ObjectId], ref: "FeeHead", default: [] },

    /**
     * How many of these the school has funded. Null means no cap.
     *
     * The whole reason to record it: awarding the twenty-first scholarship out of twenty funded
     * places is a mistake nobody notices until the accounts are closed.
     */
    maxAwards: { type: Number, default: null, min: 1 },

    eligibility: { type: String, trim: true, default: "", maxlength: 1000 },
    requiresApproval: { type: Boolean, default: true },

    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },

    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

scholarshipSchemeSchema.index({ schoolId: 1, code: 1 }, { unique: true });
scholarshipSchemeSchema.index({ schoolId: 1, isActive: 1, category: 1 });

scholarshipSchemeSchema.pre("validate", function checkScheme(next) {
  if (this.discountType === "percent" && this.value > 100) {
    return next(new Error("A percentage concession cannot be more than 100"));
  }
  if (this.validFrom && this.validUntil && this.validUntil <= this.validFrom) {
    return next(new Error("The scheme must end after it starts"));
  }
  return next();
});

export const ScholarshipScheme =
  mongoose.models.ScholarshipScheme || mongoose.model("ScholarshipScheme", scholarshipSchemeSchema);
