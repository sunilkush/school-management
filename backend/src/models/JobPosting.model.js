import mongoose, { Schema } from "mongoose";

/**
 * A vacancy the school is hiring for.
 *
 * Kept separate from Designation on purpose: a designation is a permanent part of the school's
 * structure ("PGT Mathematics"), a posting is one round of hiring against it, with its own dates,
 * its own number of openings and its own pile of applicants. A school that hires two PGT Maths
 * teachers two years running has one designation and two postings.
 */

export const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract", "Temporary", "Visiting"];
export const POSTING_STATUSES = ["draft", "open", "on_hold", "closed", "filled"];

const jobPostingSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null },

    title: { type: String, required: true, trim: true, maxlength: 150 },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
    designationId: { type: Schema.Types.ObjectId, ref: "Designation", default: null },

    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: "Full Time" },
    openings: { type: Number, default: 1, min: 1 },

    description: { type: String, trim: true, default: "", maxlength: 5000 },
    requirements: { type: [String], default: [] },
    location: { type: String, trim: true, default: "" },

    /** Both optional — plenty of schools would rather not publish a number. */
    salaryMin: { type: Number, default: null, min: 0 },
    salaryMax: { type: Number, default: null, min: 0 },

    status: { type: String, enum: POSTING_STATUSES, default: "draft", index: true },
    postedAt: { type: Date, default: null },
    closesAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

jobPostingSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

jobPostingSchema.pre("validate", function checkSalaryBand(next) {
  if (this.salaryMin != null && this.salaryMax != null && this.salaryMax < this.salaryMin) {
    return next(new Error("The maximum salary cannot be below the minimum"));
  }
  return next();
});

export const JobPosting =
  mongoose.models.JobPosting || mongoose.model("JobPosting", jobPostingSchema);
