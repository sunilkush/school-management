import mongoose, { Schema } from "mongoose";

/**
 * One child granted one scheme, and the trail behind it.
 *
 * The trail is the point. A concession is the school choosing to take less money, and "who
 * approved this and on what grounds" is a question that gets asked months later — at an audit, at
 * a committee meeting, or when a parent asks why their neighbour pays less. An anonymous
 * percentage on the enrolment record cannot answer any of it.
 */

export const AWARD_STATUSES = ["pending", "approved", "rejected", "revoked"];

const scholarshipAwardSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    schemeId: { type: Schema.Types.ObjectId, ref: "ScholarshipScheme", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null, index: true },

    status: { type: String, enum: AWARD_STATUSES, default: "pending", index: true },

    /** Why it was granted — free text, because the real reasons never fit a dropdown. */
    reason: { type: String, trim: true, default: "", maxlength: 1000 },

    requestedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    requestedAt: { type: Date, default: Date.now },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    /** Kept for rejections and revocations alike — both need a reason on the record. */
    decisionNote: { type: String, trim: true, default: "", maxlength: 1000 },

    revokedAt: { type: Date, default: null },

    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },

    /**
     * What this award actually took off the bill, worked out when the concession was last
     * recalculated. Stored rather than derived on read: a scheme's value can be edited later, and
     * a figure the school has already reported must not change underneath it.
     */
    appliedAmount: { type: Number, default: null, min: 0 },
    appliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The same child cannot hold the same scheme twice in one year — two awards would double the
// concession and neither would look wrong on its own.
scholarshipAwardSchema.index(
  { schemeId: 1, studentId: 1, academicYearId: 1 },
  { unique: true }
);
scholarshipAwardSchema.index({ schoolId: 1, status: 1, createdAt: -1 });
scholarshipAwardSchema.index({ schoolId: 1, studentId: 1, status: 1 });

export const ScholarshipAward =
  mongoose.models.ScholarshipAward || mongoose.model("ScholarshipAward", scholarshipAwardSchema);
