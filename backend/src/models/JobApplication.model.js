import mongoose, { Schema } from "mongoose";

/**
 * One candidate against one posting, and everything that happened to them.
 *
 * The stage history is embedded rather than kept in its own collection because it is never wanted
 * on its own — every read of it is "show me this candidate", and a school hiring five teachers a
 * year will never have enough of it to justify a join.
 *
 * The point of the model is that nothing about a candidate lives in somebody's inbox. Who
 * interviewed them, what was said, why they were turned down — a school that turns down a
 * candidate and cannot say why six months later has a problem, and a school that loses a good CV
 * has a more expensive one.
 */

export const APPLICATION_STAGES = ["applied", "shortlisted", "interview", "demo_class", "offered", "hired", "rejected", "withdrawn"];
/** Stages a candidate cannot move on from. */
export const TERMINAL_STAGES = ["hired", "rejected", "withdrawn"];

const stageEventSchema = new Schema(
  {
    stage: { type: String, enum: APPLICATION_STAGES, required: true },
    at: { type: Date, required: true, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, trim: true, default: "", maxlength: 1000 },
    /** Set when the stage was an assessment. 1-5, to match the appraisal scale. */
    rating: { type: Number, default: null, min: 1, max: 5 },
    scheduledFor: { type: Date, default: null },
  },
  { _id: false }
);

const jobApplicationSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    jobPostingId: { type: Schema.Types.ObjectId, ref: "JobPosting", required: true, index: true },

    candidateName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },

    /** A link, not an upload. A school's CVs already live in Drive or email; asking them to move
     *  the files somewhere new is a bigger ask than it looks and buys nothing here. */
    resumeUrl: { type: String, trim: true, default: "" },

    qualification: { type: String, trim: true, default: "" },
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    currentEmployer: { type: String, trim: true, default: "" },
    expectedSalary: { type: Number, default: null, min: 0 },
    noticePeriodDays: { type: Number, default: null, min: 0 },

    source: { type: String, trim: true, default: "" },

    stage: { type: String, enum: APPLICATION_STAGES, default: "applied", index: true },
    history: { type: [stageEventSchema], default: [] },

    /** Filled in when a hire actually becomes a member of staff. */
    hiredEmployeeId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// One person cannot be in the running twice for the same post. Two applications would give the
// same candidate two stages and two decisions, and whichever was opened last would look like
// the truth.
jobApplicationSchema.index({ jobPostingId: 1, email: 1 }, { unique: true });
jobApplicationSchema.index({ schoolId: 1, stage: 1, createdAt: -1 });

export const JobApplication =
  mongoose.models.JobApplication || mongoose.model("JobApplication", jobApplicationSchema);
