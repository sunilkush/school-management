import { Survey } from "../models/Survey.model.js";
import { SurveyParticipation } from "../models/SurveyParticipation.model.js";
import { SurveyResponse } from "../models/SurveyResponse.model.js";
import { User } from "../models/user.model.js";

/**
 * Validating answers against the questions that were asked, and summarising what came back.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Checks a set of answers against the survey's own questions.
 *
 * Returns a list of problems rather than throwing on the first one, so somebody who missed three
 * required questions is told about all three instead of discovering them one submit at a time.
 */
export const validateAnswers = (survey, answers = []) => {
  const byKey = new Map(answers.map((a) => [a.questionKey, a.value]));
  const problems = [];

  for (const question of survey.questions) {
    const value = byKey.get(question.key);
    const isEmpty = value === undefined || value === null || value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (question.required && isEmpty) {
      problems.push(`"${question.text}" is required`);
      continue;
    }
    if (isEmpty) continue;

    switch (question.type) {
      case "rating": {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 1 || n > 5) problems.push(`"${question.text}" must be a rating from 1 to 5`);
        break;
      }
      case "number": {
        if (!Number.isFinite(Number(value))) problems.push(`"${question.text}" must be a number`);
        break;
      }
      case "yes_no": {
        if (typeof value !== "boolean") problems.push(`"${question.text}" must be yes or no`);
        break;
      }
      case "single_choice": {
        if (!question.options.includes(value)) problems.push(`"${value}" is not an option for "${question.text}"`);
        break;
      }
      case "multi_choice": {
        if (!Array.isArray(value)) {
          problems.push(`"${question.text}" expects a list of choices`);
          break;
        }
        const unknown = value.filter((v) => !question.options.includes(v));
        if (unknown.length) problems.push(`Not an option for "${question.text}": ${unknown.join(", ")}`);
        break;
      }
      default:
        // Free text — anything the length limit allows.
        if (typeof value !== "string") problems.push(`"${question.text}" expects text`);
    }
  }

  // An answer to a question that is not on the survey means the form and the survey have drifted
  // apart, and quietly dropping it would hide that.
  const known = new Set(survey.questions.map((q) => q.key));
  answers.forEach((a) => {
    if (!known.has(a.questionKey)) problems.push(`"${a.questionKey}" is not a question on this survey`);
  });

  return problems;
};

/**
 * Question-by-question summary of what came back.
 *
 * Ratings get an average and the spread, not just the average: a subject where half the class said
 * 5 and half said 1 averages the same as one where everybody said 3, and those are not the same
 * school.
 */
export const summariseResponses = async ({ schoolId, surveyId }) => {
  const survey = await Survey.findOne({ _id: surveyId, schoolId }).lean();
  if (!survey) return null;

  const responses = await SurveyResponse.find({ surveyId }).select("answers").lean();
  const answered = new Map();
  responses.forEach((r) => {
    r.answers.forEach((a) => {
      if (!answered.has(a.questionKey)) answered.set(a.questionKey, []);
      answered.get(a.questionKey).push(a.value);
    });
  });

  const questions = survey.questions.map((question) => {
    const values = (answered.get(question.key) || []).filter(
      (v) => v !== null && v !== undefined && v !== ""
    );
    const base = { key: question.key, text: question.text, type: question.type, answered: values.length };

    if (question.type === "rating" || question.type === "number") {
      const numbers = values.map(Number).filter(Number.isFinite);
      if (!numbers.length) return { ...base, average: null, distribution: {} };
      const distribution = numbers.reduce((acc, n) => { acc[n] = (acc[n] || 0) + 1; return acc; }, {});
      return {
        ...base,
        average: round2(numbers.reduce((s, n) => s + n, 0) / numbers.length),
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        distribution,
      };
    }

    if (question.type === "yes_no") {
      const yes = values.filter((v) => v === true).length;
      return { ...base, yes, no: values.length - yes, percentYes: values.length ? Math.round((yes / values.length) * 100) : 0 };
    }

    if (question.type === "single_choice" || question.type === "multi_choice") {
      const counts = {};
      question.options.forEach((o) => { counts[o] = 0; });
      values.flat().forEach((v) => { if (counts[v] !== undefined) counts[v] += 1; });
      return { ...base, counts };
    }

    // Free text is listed, not counted. Nothing useful comes from averaging sentences, and the
    // comments are usually the reason the survey was run.
    return { ...base, texts: values.filter((v) => typeof v === "string").slice(0, 300) };
  });

  const participation = await SurveyParticipation.countDocuments({ surveyId });
  const total = survey.recipientCount || survey.recipients?.length || 0;

  return {
    title: survey.title,
    isAnonymous: survey.isAnonymous,
    status: survey.status,
    sentTo: total,
    responded: participation,
    responseRate: total ? Math.round((participation / total) * 100) : 0,
    questions,
  };
};

/**
 * Who has not replied yet.
 *
 * Works from SurveyParticipation, so it answers the same on an anonymous survey as on a named one
 * without ever touching the answers.
 */
export const pendingRespondents = async ({ schoolId, surveyId, limit = 500 }) => {
  const survey = await Survey.findOne({ _id: surveyId, schoolId }).select("recipients").lean();
  if (!survey) return [];

  const done = await SurveyParticipation.find({ surveyId }).select("userId").lean();
  const replied = new Set(done.map((d) => String(d.userId)));

  const outstanding = (survey.recipients || []).filter((id) => !replied.has(String(id)));

  const users = await User.find({ _id: { $in: outstanding.slice(0, limit) } })
    .populate("roleId", "name")
    .select("name email roleId")
    .lean();

  return users.map((u) => ({ userId: u._id, name: u.name, email: u.email, role: u.roleId?.name || "" }));
};

/** Whether a survey is currently accepting answers. */
export const isAcceptingResponses = (survey, now = new Date()) => {
  if (survey.status !== "open") return "This survey is not open";
  if (survey.opensAt && new Date(survey.opensAt) > now) return "This survey has not opened yet";
  if (survey.closesAt && new Date(survey.closesAt) < now) return "This survey has closed";
  return null;
};
