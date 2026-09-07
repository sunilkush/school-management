import { AppraisalReview } from "../models/AppraisalReview.model.js";
import { JobApplication, TERMINAL_STAGES } from "../models/JobApplication.model.js";
import { JobPosting } from "../models/JobPosting.model.js";

/**
 * The two bits of HR that are worth keeping out of the controllers: how an appraisal score is
 * worked out, and what a hiring pipeline actually looks like at a glance.
 */

/* ── Appraisal scoring ───────────────────────────────────────────── */

/**
 * Weighted average of a set of scores, out of 5.
 *
 * Only criteria that were actually scored count toward the weight. A reviewer who fills in four of
 * five criteria should get an honest average of those four — dividing by the full 100 instead
 * would quietly mark the employee down for the reviewer's omission.
 */
export const weightedScore = (criteria, scores) => {
  if (!criteria?.length || !scores?.length) return null;

  const byName = new Map(scores.map((s) => [s.criterion, s.score]));
  let weighted = 0;
  let weightUsed = 0;

  for (const criterion of criteria) {
    const score = byName.get(criterion.name);
    if (score == null) continue;
    weighted += score * criterion.weight;
    weightUsed += criterion.weight;
  }

  if (!weightUsed) return null;
  return Math.round((weighted / weightUsed) * 100) / 100;
};

/** Plain words for a number, so nobody has to decide what 3.7 means. */
export const scoreBand = (score) => {
  if (score == null) return "";
  if (score >= 4.5) return "Outstanding";
  if (score >= 3.5) return "Exceeds expectations";
  if (score >= 2.5) return "Meets expectations";
  if (score >= 1.5) return "Needs improvement";
  return "Unsatisfactory";
};

/**
 * Where the self-assessment and the reviewer disagree most.
 *
 * This is the part of an appraisal worth reading. A criterion where somebody rates themselves two
 * points above their reviewer is the conversation to have; one where they agree is not.
 */
export const scoreGaps = (selfScores = [], reviewerScores = []) => {
  const selfBy = new Map(selfScores.map((s) => [s.criterion, s.score]));

  return reviewerScores
    .filter((r) => selfBy.has(r.criterion))
    .map((r) => ({
      criterion: r.criterion,
      self: selfBy.get(r.criterion),
      reviewer: r.score,
      gap: selfBy.get(r.criterion) - r.score,
    }))
    .filter((row) => row.gap !== 0)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
};

/** How far through a cycle the school is — the number an HR lead actually asks for. */
export const cycleProgress = async ({ schoolId, cycleId }) => {
  const reviews = await AppraisalReview.find({ schoolId, cycleId }).select("status overallScore").lean();

  const counts = reviews.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {}
  );
  const scored = reviews.filter((r) => r.overallScore != null);

  return {
    total: reviews.length,
    pending: counts.pending || 0,
    selfSubmitted: counts.self_submitted || 0,
    reviewed: counts.reviewed || 0,
    finalised: counts.finalised || 0,
    averageScore: scored.length
      ? Math.round((scored.reduce((s, r) => s + r.overallScore, 0) / scored.length) * 100) / 100
      : null,
  };
};

/* ── Hiring pipeline ─────────────────────────────────────────────── */

/**
 * The funnel for one posting, or for every open posting.
 *
 * Reported per stage rather than as a single "applications" count, because the number that
 * matters when a term starts in three weeks is how many people are actually near an offer.
 */
export const hiringPipeline = async ({ schoolId, jobPostingId = null }) => {
  const filter = { schoolId, ...(jobPostingId ? { jobPostingId } : {}) };
  const applications = await JobApplication.find(filter).select("stage jobPostingId").lean();

  const byStage = applications.reduce(
    (acc, a) => { acc[a.stage] = (acc[a.stage] || 0) + 1; return acc; },
    {}
  );

  const active = applications.filter((a) => !TERMINAL_STAGES.includes(a.stage)).length;

  const postings = await JobPosting.find({
    schoolId,
    ...(jobPostingId ? { _id: jobPostingId } : { status: "open" }),
  })
    .select("title openings status")
    .lean();

  const hired = byStage.hired || 0;
  const openings = postings.reduce((sum, p) => sum + (p.openings || 0), 0);

  return {
    byStage,
    active,
    hired,
    openings,
    // Deliberately not clamped: hiring three people against two openings is a real thing that
    // happens and the school should see it rather than have it rounded away.
    stillToFill: openings - hired,
    postings: postings.length,
  };
};

/** Whether a stage move is allowed, and why not when it isn't. */
export const validateStageMove = (from, to) => {
  if (from === to) return "The candidate is already at that stage";
  if (TERMINAL_STAGES.includes(from)) {
    // Reopening is a deliberate act, not a side effect of clicking through a list.
    return `This candidate was already marked "${from}" — reopen the application first`;
  }
  return null;
};
