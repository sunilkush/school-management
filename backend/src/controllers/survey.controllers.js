import mongoose from "mongoose";

import { Survey } from "../models/Survey.model.js";
import { SurveyParticipation } from "../models/SurveyParticipation.model.js";
import { SurveyResponse } from "../models/SurveyResponse.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import { resolveRecipients } from "../services/circular.service.js";
import {
  isAcceptingResponses,
  pendingRespondents,
  summariseResponses,
  validateAnswers,
} from "../services/survey.service.js";

/**
 * Surveys and feedback forms.
 *
 * The audience is resolved by the same code circulars use — "the parents of Class 8" means the
 * same thing whichever of the two is being sent, and two implementations of that would eventually
 * disagree.
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

/* ══ Building ═════════════════════════════════════════════════════ */

export const listSurveys = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { status } = req.query;

  const surveys = await Survey.find({ schoolId, ...(status ? { status } : {}) })
    .select("-recipients")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const counts = await SurveyParticipation.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
    { $group: { _id: "$surveyId", n: { $sum: 1 } } },
  ]);
  const bySurvey = new Map(counts.map((c) => [String(c._id), c.n]));

  return res.json(
    new ApiResponse(
      200,
      surveys.map((s) => {
        const responded = bySurvey.get(String(s._id)) || 0;
        return {
          ...s,
          responded,
          responseRate: s.recipientCount ? Math.round((responded / s.recipientCount) * 100) : 0,
        };
      }),
      "Surveys fetched"
    )
  );
});

export const createSurvey = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { title, description, questions, audience, isAnonymous, opensAt, closesAt, academicYearId } = req.body;

  if (!title?.trim()) throw new ApiError(400, "A title is required");

  const survey = await Survey.create({
    schoolId,
    academicYearId: academicYearId || null,
    title: title.trim(),
    description: description || "",
    questions: Array.isArray(questions) ? questions : [],
    audience: {
      roles: audience?.roles || [],
      schoolClassIds: audience?.schoolClassIds || [],
      sectionIds: audience?.sectionIds || [],
      userIds: audience?.userIds || [],
    },
    isAnonymous: Boolean(isAnonymous),
    opensAt: parseDate(opensAt, "opening date"),
    closesAt: parseDate(closesAt, "closing date"),
    status: "draft",
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, survey, "Survey saved as a draft"));
});

export const updateSurvey = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const survey = await Survey.findOne({ _id: objectId(req.params.id, "survey id"), schoolId });
  if (!survey) throw new ApiError(404, "Survey not found");
  if (survey.status !== "draft") {
    // The model refuses it too; this says so before the work is lost.
    throw new ApiError(400, "An open survey's questions cannot be changed — close it and run a new one");
  }

  const fields = ["title", "description", "questions", "audience", "isAnonymous"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) survey[field] = req.body[field];
  });
  if (req.body.opensAt !== undefined) survey.opensAt = parseDate(req.body.opensAt, "opening date");
  if (req.body.closesAt !== undefined) survey.closesAt = parseDate(req.body.closesAt, "closing date");

  await survey.save();
  return res.json(new ApiResponse(200, survey, "Survey updated"));
});

/** Opens it: freezes the questions and the recipient list, same as publishing a circular. */
export const openSurvey = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const survey = await Survey.findOne({ _id: objectId(req.params.id, "survey id"), schoolId });
  if (!survey) throw new ApiError(404, "Survey not found");
  if (survey.status !== "draft") throw new ApiError(400, `This survey is already ${survey.status}`);
  if (!survey.questions.length) throw new ApiError(400, "Add at least one question first");

  const recipients = await resolveRecipients({
    schoolId,
    audience: survey.audience,
    academicYearId: survey.academicYearId,
  });
  if (!recipients.length) {
    throw new ApiError(400, "That audience matches nobody — check the roles and classes selected");
  }

  survey.recipients = recipients;
  survey.recipientCount = recipients.length;
  survey.status = "open";
  survey.openedAt = new Date();
  await survey.save();

  return res.json(new ApiResponse(200, survey, `Open to ${recipients.length} recipient(s)`));
});

export const closeSurvey = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const survey = await Survey.findOne({ _id: objectId(req.params.id, "survey id"), schoolId });
  if (!survey) throw new ApiError(404, "Survey not found");
  if (survey.status !== "open") throw new ApiError(400, "Only an open survey can be closed");

  survey.status = "closed";
  survey.closedAt = new Date();
  await survey.save();

  return res.json(new ApiResponse(200, survey, "Survey closed"));
});

export const deleteSurvey = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const survey = await Survey.findOne({ _id: objectId(req.params.id, "survey id"), schoolId });
  if (!survey) throw new ApiError(404, "Survey not found");
  if (survey.status !== "draft") {
    // Deleting a survey people answered would throw away what they said.
    throw new ApiError(400, "Only a draft can be deleted — close a survey that has gone out");
  }

  await survey.deleteOne();
  return res.json(new ApiResponse(200, null, "Draft deleted"));
});

/* ══ Answering ════════════════════════════════════════════════════ */

export const mySurveys = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);

  const surveys = await Survey.find({ schoolId, status: "open", recipients: req.user._id })
    .select("-recipients")
    .sort({ createdAt: -1 })
    .lean();

  const done = await SurveyParticipation.find({
    surveyId: { $in: surveys.map((s) => s._id) },
    userId: req.user._id,
  }).lean();
  const replied = new Set(done.map((d) => String(d.surveyId)));

  const data = surveys.map((s) => ({
    ...s,
    hasResponded: replied.has(String(s._id)),
    closedReason: isAcceptingResponses(s),
  }));

  return res.json(
    new ApiResponse(200, data, `${data.filter((s) => !s.hasResponded && !s.closedReason).length} survey(s) waiting for you`)
  );
});

export const submitResponse = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const survey = await Survey.findOne({ _id: objectId(req.params.id, "survey id"), schoolId }).lean();
  if (!survey) throw new ApiError(404, "Survey not found");

  const closedReason = isAcceptingResponses(survey);
  if (closedReason) throw new ApiError(400, closedReason);

  const isRecipient = (survey.recipients || []).some((id) => String(id) === String(req.user._id));
  if (!isRecipient) throw new ApiError(403, "This survey was not sent to you");

  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const problems = validateAnswers(survey, answers);
  if (problems.length) throw new ApiError(400, problems.join("; "));

  const already = await SurveyParticipation.findOne({ surveyId: survey._id, userId: req.user._id });
  if (already && survey.isAnonymous) {
    // There is no way to find their previous answers to replace — that is the price of the
    // response carrying nothing that points back at them, and it is the right trade.
    throw new ApiError(400, "You have already answered this survey, and anonymous answers cannot be changed");
  }

  if (already) {
    await SurveyResponse.updateOne(
      { surveyId: survey._id, respondentId: req.user._id },
      { $set: { answers, submittedAt: new Date() } }
    );
  } else {
    await SurveyResponse.create({
      schoolId,
      surveyId: survey._id,
      // The whole anonymity guarantee is this line.
      respondentId: survey.isAnonymous ? null : req.user._id,
      respondentRole: req.userRole?.name || "",
      answers,
    });
    await SurveyParticipation.create({ schoolId, surveyId: survey._id, userId: req.user._id });
  }

  return res.json(
    new ApiResponse(200, { submitted: true, canChange: !survey.isAnonymous }, already ? "Your answers were updated" : "Thank you")
  );
});

/** The caller's own answers, so a form can be reopened and edited — named surveys only. */
export const myResponse = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const survey = await Survey.findOne({ _id: objectId(req.params.id, "survey id"), schoolId }).select("isAnonymous").lean();
  if (!survey) throw new ApiError(404, "Survey not found");

  if (survey.isAnonymous) {
    const participated = await SurveyParticipation.exists({ surveyId: survey._id, userId: req.user._id });
    return res.json(
      new ApiResponse(200, { hasResponded: Boolean(participated), answers: null, isAnonymous: true }, "Anonymous — answers cannot be looked up")
    );
  }

  const response = await SurveyResponse.findOne({ surveyId: survey._id, respondentId: req.user._id }).lean();
  return res.json(
    new ApiResponse(200, { hasResponded: Boolean(response), answers: response?.answers || null, isAnonymous: false }, "Your response")
  );
});

/* ══ Results ══════════════════════════════════════════════════════ */

export const getResults = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await summariseResponses({ schoolId, surveyId: objectId(req.params.id, "survey id") });
  if (!data) throw new ApiError(404, "Survey not found");
  return res.json(new ApiResponse(200, data, "Results"));
});

export const getPending = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const rows = await pendingRespondents({ schoolId, surveyId: objectId(req.params.id, "survey id") });
  return res.json(new ApiResponse(200, rows, rows.length ? `${rows.length} still to answer` : "Everybody has answered"));
});

/**
 * The individual responses, for a survey that is not anonymous.
 *
 * Refused outright on an anonymous one rather than returned with the names stripped: a route that
 * sometimes hands back rows and sometimes hands back rows-without-names is one refactor away from
 * handing back the names.
 */
export const getResponses = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const survey = await Survey.findOne({ _id: objectId(req.params.id, "survey id"), schoolId }).select("isAnonymous").lean();
  if (!survey) throw new ApiError(404, "Survey not found");
  if (survey.isAnonymous) {
    throw new ApiError(400, "This survey is anonymous — only the summary is available");
  }

  const responses = await SurveyResponse.find({ surveyId: survey._id })
    .populate("respondentId", "name email")
    .sort({ submittedAt: -1 })
    .limit(1000)
    .lean();

  return res.json(new ApiResponse(200, responses, `${responses.length} response(s)`));
});
