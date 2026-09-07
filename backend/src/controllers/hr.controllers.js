import mongoose from "mongoose";

import { AppraisalCycle } from "../models/AppraisalCycle.model.js";
import { AppraisalReview } from "../models/AppraisalReview.model.js";
import { Employee } from "../models/Employee.model.js";
import { JobApplication, TERMINAL_STAGES } from "../models/JobApplication.model.js";
import { JobPosting } from "../models/JobPosting.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  cycleProgress,
  hiringPipeline,
  scoreBand,
  scoreGaps,
  validateStageMove,
  weightedScore,
} from "../services/hr.service.js";

/**
 * Recruitment and staff appraisal.
 *
 * Two halves of the same job: getting people in, and telling them how they are doing once they
 * are. They share a controller because they share the same small audience — whoever runs HR at a
 * school, which is usually the head's office rather than a department.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const parseDate = (value, label) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return d;
};

const objectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(400, `Invalid ${label}`);
  return value;
};

/* ══ Job postings ═════════════════════════════════════════════════ */

export const listPostings = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { status, departmentId } = req.query;

  const postings = await JobPosting.find({
    schoolId,
    ...(status ? { status } : {}),
    ...(departmentId ? { departmentId } : {}),
  })
    .populate("departmentId", "name")
    .populate("designationId", "title")
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  // The applicant count is what makes the list useful — a posting with no applicants a week
  // before term needs different attention from one with thirty.
  const counts = await JobApplication.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), jobPostingId: { $in: postings.map((p) => p._id) } } },
    { $group: { _id: { posting: "$jobPostingId", stage: "$stage" }, n: { $sum: 1 } } },
  ]);

  const byPosting = new Map();
  counts.forEach((row) => {
    const key = String(row._id.posting);
    const entry = byPosting.get(key) || { total: 0, active: 0, hired: 0 };
    entry.total += row.n;
    if (row._id.stage === "hired") entry.hired += row.n;
    if (!TERMINAL_STAGES.includes(row._id.stage)) entry.active += row.n;
    byPosting.set(key, entry);
  });

  return res.json(
    new ApiResponse(
      200,
      postings.map((p) => ({ ...p, applicants: byPosting.get(String(p._id)) || { total: 0, active: 0, hired: 0 } })),
      "Job postings fetched"
    )
  );
});

export const createPosting = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { title, departmentId, designationId, employmentType, openings, description, requirements, location, salaryMin, salaryMax, closesAt, academicYearId } = req.body;

  if (!title?.trim()) throw new ApiError(400, "A job title is required");

  const posting = await JobPosting.create({
    schoolId,
    academicYearId: academicYearId || null,
    title: title.trim(),
    departmentId: departmentId || null,
    designationId: designationId || null,
    employmentType: employmentType || "Full Time",
    openings: openings || 1,
    description: description || "",
    requirements: Array.isArray(requirements) ? requirements : [],
    location: location || "",
    salaryMin: salaryMin ?? null,
    salaryMax: salaryMax ?? null,
    closesAt: parseDate(closesAt, "closing date"),
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, posting, "Job posting created"));
});

export const updatePosting = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const posting = await JobPosting.findOne({ _id: objectId(req.params.id, "posting id"), schoolId });
  if (!posting) throw new ApiError(404, "Job posting not found");

  const fields = ["title", "departmentId", "designationId", "employmentType", "openings", "description", "requirements", "location", "salaryMin", "salaryMax"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) posting[field] = req.body[field];
  });
  if (req.body.closesAt !== undefined) posting.closesAt = parseDate(req.body.closesAt, "closing date");

  if (req.body.status !== undefined) {
    posting.status = req.body.status;
    // Opening it is what makes it real, so that is when it gets its posted date.
    if (req.body.status === "open" && !posting.postedAt) posting.postedAt = new Date();
  }

  await posting.save();
  return res.json(new ApiResponse(200, posting, "Job posting updated"));
});

export const deletePosting = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const posting = await JobPosting.findOne({ _id: objectId(req.params.id, "posting id"), schoolId });
  if (!posting) throw new ApiError(404, "Job posting not found");

  const applicants = await JobApplication.countDocuments({ jobPostingId: posting._id });
  if (applicants > 0) {
    // The applications are a record of people the school dealt with, including the ones it turned
    // down. Deleting the posting would orphan all of it.
    throw new ApiError(400, `Cannot delete — ${applicants} candidate(s) applied. Close the posting instead.`);
  }

  await posting.deleteOne();
  return res.json(new ApiResponse(200, null, "Job posting deleted"));
});

/* ══ Applications ═════════════════════════════════════════════════ */

export const listApplications = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { jobPostingId, stage, search } = req.query;

  const filter = { schoolId };
  if (jobPostingId) filter.jobPostingId = jobPostingId;
  if (stage) filter.stage = stage;
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ candidateName: rx }, { email: rx }, { currentEmployer: rx }];
  }

  const applications = await JobApplication.find(filter)
    .populate("jobPostingId", "title status")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return res.json(new ApiResponse(200, applications, "Applications fetched"));
});

export const createApplication = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { jobPostingId, candidateName, email } = req.body;

  const posting = await JobPosting.findOne({ _id: objectId(jobPostingId, "posting id"), schoolId });
  if (!posting) throw new ApiError(404, "Job posting not found");
  if (!candidateName?.trim()) throw new ApiError(400, "The candidate's name is required");
  if (!email?.trim()) throw new ApiError(400, "The candidate's email is required");

  try {
    const application = await JobApplication.create({
      schoolId,
      jobPostingId: posting._id,
      candidateName: candidateName.trim(),
      email: email.trim().toLowerCase(),
      phone: req.body.phone || "",
      resumeUrl: req.body.resumeUrl || "",
      qualification: req.body.qualification || "",
      experienceYears: req.body.experienceYears ?? 0,
      currentEmployer: req.body.currentEmployer || "",
      expectedSalary: req.body.expectedSalary ?? null,
      noticePeriodDays: req.body.noticePeriodDays ?? null,
      source: req.body.source || "",
      stage: "applied",
      history: [{ stage: "applied", at: new Date(), by: req.user._id, note: "Application received" }],
      createdBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, application, "Application recorded"));
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "That candidate has already applied for this post");
    }
    throw error;
  }
});

/**
 * Moves a candidate along, and records why.
 *
 * The note is part of the move rather than a separate action: a school that rejects somebody and
 * cannot say why six months later is exactly the problem this replaces.
 */
export const moveApplicationStage = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const application = await JobApplication.findOne({ _id: objectId(req.params.id, "application id"), schoolId });
  if (!application) throw new ApiError(404, "Application not found");

  const { stage, note, rating, scheduledFor } = req.body;
  if (!stage) throw new ApiError(400, "A stage is required");

  const problem = validateStageMove(application.stage, stage);
  if (problem) throw new ApiError(400, problem);

  application.stage = stage;
  application.history.push({
    stage,
    at: new Date(),
    by: req.user._id,
    note: note || "",
    rating: rating ?? null,
    scheduledFor: parseDate(scheduledFor, "scheduled date"),
  });
  await application.save();

  // Filling the last opening closes the posting on its own — otherwise it sits "open" and the
  // school keeps getting applications for a job that no longer exists.
  if (stage === "hired") {
    const posting = await JobPosting.findById(application.jobPostingId);
    if (posting && posting.status === "open") {
      const hired = await JobApplication.countDocuments({ jobPostingId: posting._id, stage: "hired" });
      if (hired >= posting.openings) {
        posting.status = "filled";
        await posting.save();
      }
    }
  }

  return res.json(new ApiResponse(200, application, `Moved to ${stage}`));
});

export const reopenApplication = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const application = await JobApplication.findOne({ _id: objectId(req.params.id, "application id"), schoolId });
  if (!application) throw new ApiError(404, "Application not found");
  if (!TERMINAL_STAGES.includes(application.stage)) throw new ApiError(400, "This application is still open");

  application.stage = "shortlisted";
  application.history.push({
    stage: "shortlisted",
    at: new Date(),
    by: req.user._id,
    note: req.body.note || "Reopened",
  });
  await application.save();

  return res.json(new ApiResponse(200, application, "Application reopened"));
});

export const getPipeline = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await hiringPipeline({ schoolId, jobPostingId: req.query.jobPostingId || null });
  return res.json(new ApiResponse(200, data, "Hiring pipeline"));
});

/* ══ Appraisal cycles ═════════════════════════════════════════════ */

export const listCycles = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const cycles = await AppraisalCycle.find({ schoolId }).sort({ createdAt: -1 }).lean();

  const withProgress = await Promise.all(
    cycles.map(async (cycle) => ({ ...cycle, progress: await cycleProgress({ schoolId, cycleId: cycle._id }) }))
  );

  return res.json(new ApiResponse(200, withProgress, "Appraisal cycles fetched"));
});

export const createCycle = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { name, periodStart, periodEnd, criteria, selfAssessmentRequired, academicYearId } = req.body;

  if (!name?.trim()) throw new ApiError(400, "A cycle name is required");
  const start = parseDate(periodStart, "period start");
  const end = parseDate(periodEnd, "period end");
  if (!start || !end) throw new ApiError(400, "Both a start and an end date are required");

  const cycle = await AppraisalCycle.create({
    schoolId,
    academicYearId: academicYearId || null,
    name: name.trim(),
    periodStart: start,
    periodEnd: end,
    criteria: Array.isArray(criteria) ? criteria : [],
    selfAssessmentRequired: selfAssessmentRequired !== false,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, cycle, "Appraisal cycle created"));
});

export const updateCycle = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const cycle = await AppraisalCycle.findOne({ _id: objectId(req.params.id, "cycle id"), schoolId });
  if (!cycle) throw new ApiError(404, "Appraisal cycle not found");

  // Criteria are the yardstick everyone in the round is measured against. Changing them once
  // reviews exist would mean two people in the same cycle were scored on different things.
  if (req.body.criteria !== undefined) {
    if (cycle.status !== "draft") throw new ApiError(400, "Criteria can only be changed while the cycle is a draft");
    cycle.criteria = req.body.criteria;
  }
  if (req.body.name !== undefined) cycle.name = req.body.name;
  if (req.body.selfAssessmentRequired !== undefined) cycle.selfAssessmentRequired = req.body.selfAssessmentRequired;
  if (req.body.periodStart !== undefined) cycle.periodStart = parseDate(req.body.periodStart, "period start");
  if (req.body.periodEnd !== undefined) cycle.periodEnd = parseDate(req.body.periodEnd, "period end");
  if (req.body.status !== undefined) {
    cycle.status = req.body.status;
    if (req.body.status === "closed") cycle.closedAt = new Date();
  }

  await cycle.save();
  return res.json(new ApiResponse(200, cycle, "Appraisal cycle updated"));
});

/**
 * Creates a review for everyone the cycle covers.
 *
 * Done as one deliberate action rather than lazily on first open: an HR lead needs to know the
 * round has actually started for all forty staff, not discover in March that eleven of them never
 * had a review created.
 */
export const startCycleReviews = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const cycle = await AppraisalCycle.findOne({ _id: objectId(req.params.id, "cycle id"), schoolId });
  if (!cycle) throw new ApiError(404, "Appraisal cycle not found");
  if (cycle.status === "closed") throw new ApiError(400, "That cycle is closed");
  if (!cycle.criteria?.length) throw new ApiError(400, "Add the criteria before starting the reviews");

  if (cycle.status === "draft") {
    cycle.status = "open";
    await cycle.save();
  }

  const employees = await Employee.find({ schoolId }).select("_id userId").lean();
  if (!employees.length) throw new ApiError(400, "There are no employees to review");

  const existing = await AppraisalReview.find({ cycleId: cycle._id }).select("employeeId").lean();
  const already = new Set(existing.map((r) => String(r.employeeId)));

  const toCreate = employees
    .filter((e) => !already.has(String(e._id)))
    .map((e) => ({
      schoolId,
      cycleId: cycle._id,
      employeeId: e._id,
      userId: e.userId || null,
      reviewerId: req.body.reviewerId || null,
      status: "pending",
    }));

  if (toCreate.length) await AppraisalReview.insertMany(toCreate);

  return res.json(
    new ApiResponse(
      200,
      { created: toCreate.length, alreadyExisted: already.size, total: employees.length },
      toCreate.length ? `${toCreate.length} review(s) opened` : "Every employee already has a review in this cycle"
    )
  );
});

/* ══ Reviews ══════════════════════════════════════════════════════ */

export const listReviews = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { cycleId, status } = req.query;

  const reviews = await AppraisalReview.find({
    schoolId,
    ...(cycleId ? { cycleId } : {}),
    ...(status ? { status } : {}),
  })
    .populate({ path: "employeeId", select: "userId designation", populate: { path: "userId", select: "name email" } })
    .populate("reviewerId", "name")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return res.json(new ApiResponse(200, reviews, "Reviews fetched"));
});

/** The logged-in member of staff's own review — the only one they may open. */
export const getMyReview = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { cycleId } = req.query;

  const review = await AppraisalReview.findOne({
    schoolId,
    userId: req.user._id,
    ...(cycleId ? { cycleId } : {}),
  })
    .populate("cycleId", "name periodStart periodEnd criteria status selfAssessmentRequired")
    .sort({ createdAt: -1 })
    .lean();

  if (!review) return res.json(new ApiResponse(200, null, "You have no appraisal open"));

  // A staff member sees their reviewer's scores only once the review is finalised — a half-filled
  // reviewer form read over somebody's shoulder is worse than no form at all.
  const visible = review.status === "finalised"
    ? review
    : { ...review, reviewerScores: [], reviewerComment: "", overallScore: null, overallBand: "" };

  return res.json(new ApiResponse(200, visible, "Your appraisal"));
});

export const submitSelfAssessment = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const review = await AppraisalReview.findOne({ _id: objectId(req.params.id, "review id"), schoolId });
  if (!review) throw new ApiError(404, "Review not found");

  // Only the person being reviewed can write their own self-assessment. Anyone else filling it in
  // makes the gap between self and reviewer scores meaningless.
  if (String(review.userId || "") !== String(req.user._id)) {
    throw new ApiError(403, "This is not your appraisal");
  }
  if (review.status === "finalised") throw new ApiError(400, "This appraisal is finalised");

  const cycle = await AppraisalCycle.findById(review.cycleId).lean();
  if (cycle?.status !== "open") throw new ApiError(400, "That appraisal cycle is not open");

  // Only what was actually sent is changed. A PATCH that blanks the fields it was not told about
  // means saving a draft and then submitting it destroys whatever the first call wrote.
  if (req.body.scores !== undefined) review.selfScores = Array.isArray(req.body.scores) ? req.body.scores : [];
  if (req.body.comment !== undefined) review.selfComment = req.body.comment;
  review.selfSubmittedAt = new Date();
  if (review.status === "pending") review.status = "self_submitted";
  await review.save();

  return res.json(new ApiResponse(200, review, "Self-assessment submitted"));
});

export const submitReview = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const review = await AppraisalReview.findOne({ _id: objectId(req.params.id, "review id"), schoolId });
  if (!review) throw new ApiError(404, "Review not found");
  if (review.status === "finalised") throw new ApiError(400, "This appraisal is finalised");

  // Nobody reviews themselves. It is the one rule that makes the rest of it mean anything.
  if (String(review.userId || "") === String(req.user._id)) {
    throw new ApiError(403, "You cannot review your own appraisal");
  }

  const cycle = await AppraisalCycle.findById(review.cycleId).lean();
  if (!cycle) throw new ApiError(404, "Appraisal cycle not found");
  if (cycle.status !== "open") throw new ApiError(400, "That appraisal cycle is not open");

  // Same rule as the self-assessment: only what was sent is changed. A reviewer who saves a draft
  // with a comment and then presses Finalise without resending it must not lose the comment.
  const scores = req.body.scores !== undefined
    ? (Array.isArray(req.body.scores) ? req.body.scores : [])
    : review.reviewerScores;

  const unknown = scores.filter((s) => !cycle.criteria.some((c) => c.name === s.criterion));
  if (unknown.length) {
    throw new ApiError(400, `Not a criterion in this cycle: ${unknown.map((u) => u.criterion).join(", ")}`);
  }

  review.reviewerScores = scores;
  if (req.body.comment !== undefined) review.reviewerComment = req.body.comment;
  review.reviewerId = req.user._id;
  review.reviewedAt = new Date();
  review.goals = Array.isArray(req.body.goals) ? req.body.goals : review.goals;

  // Stored, not computed on read: the cycle's weights can still change, and a score somebody has
  // been shown must not move afterwards.
  review.overallScore = weightedScore(cycle.criteria, scores);
  review.overallBand = scoreBand(review.overallScore);
  review.status = req.body.finalise ? "finalised" : "reviewed";
  if (req.body.finalise) review.finalisedAt = new Date();

  await review.save();

  return res.json(
    new ApiResponse(
      200,
      { ...review.toObject(), gaps: scoreGaps(review.selfScores, review.reviewerScores) },
      req.body.finalise ? "Appraisal finalised" : "Review saved"
    )
  );
});

export const getReview = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const review = await AppraisalReview.findOne({ _id: objectId(req.params.id, "review id"), schoolId })
    .populate({ path: "employeeId", select: "userId designation", populate: { path: "userId", select: "name email" } })
    .populate("cycleId", "name criteria status periodStart periodEnd")
    .populate("reviewerId", "name")
    .lean();
  if (!review) throw new ApiError(404, "Review not found");

  return res.json(
    new ApiResponse(200, { ...review, gaps: scoreGaps(review.selfScores, review.reviewerScores) }, "Review")
  );
});
