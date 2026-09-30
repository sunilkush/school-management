import { LessonPlan } from "../models/LessonPlan.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { Section } from "../models/section.model.js";
import { Subject } from "../models/subject.model.js";
import { assertAllInSchool } from "../utils/schoolScope.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

// Who approves or returns a submitted plan. A teacher used to pick "Approved" for their own plan
// in the form, and no screen let anyone else review it, so "approved" meant nothing.
export const LESSON_PLAN_REVIEWERS = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Subject Coordinator"];

// What the plan's author may move it to, from each status.
const AUTHOR_MOVES = {
  draft: ["draft", "submitted"],
  returned: ["returned", "submitted"],
  submitted: ["submitted", "draft"], // withdraw to change it
  approved: ["approved", "completed"],
  completed: ["completed"],
};

const isSuperAdmin = (req) => (req.userRole?.name || req.user?.role?.name) === "Super Admin";

const assertSameSchool = (req, plan) => {
  if (isSuperAdmin(req)) return;
  if (`${plan.schoolId}` !== `${getSchoolId(req)}`) {
    throw new ApiError(403, "Forbidden access outside your school");
  }
};

export const createLessonPlan = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const { academicYearId, schoolClassId, sectionId, subjectId, title, objectives, content, teachingMethods, resources, assessment, plannedDate, duration, status } = req.body;
  if (status && !["draft", "submitted"].includes(status)) {
    throw new ApiError(400, "A new lesson plan is saved as a draft or submitted for review");
  }

  if (!academicYearId || !schoolClassId || !subjectId || !title || !plannedDate) {
    throw new ApiError(400, "academicYearId, schoolClassId, subjectId, title, and plannedDate are required");
  }
  await assertAllInSchool(schoolId, [
    [SchoolClass, schoolClassId, "class"],
    [Section, sectionId, "section"],
    [Subject, subjectId, "subject", { allowShared: true }],
  ]);

  const plan = await LessonPlan.create({
    schoolId,
    academicYearId,
    schoolClassId,
    sectionId: sectionId || null,
    subjectId,
    teacherId: req.user._id,
    title,
    objectives: objectives || "",
    content: content || "",
    teachingMethods: teachingMethods || [],
    resources: resources || [],
    assessment: assessment || "",
    plannedDate: new Date(plannedDate),
    duration: duration || 45,
    status: status === "submitted" ? "submitted" : "draft",
    submittedAt: status === "submitted" ? new Date() : null,
  });

  return res.status(201).json(new ApiResponse(201, plan, "Lesson plan created"));
});

export const getLessonPlans = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const { academicYearId, schoolClassId, subjectId, teacherId, status, page = 1, limit = 20 } = req.query;

  const filter = { schoolId, isActive: true };
  if (academicYearId) filter.academicYearId = academicYearId;
  if (schoolClassId)  filter.schoolClassId  = schoolClassId;
  if (subjectId)      filter.subjectId      = subjectId;
  if (teacherId)      filter.teacherId      = teacherId;
  if (status)         filter.status         = status;

  const userRole = req.userRole?.name || req.user?.role?.name;
  if (userRole === "Teacher") {
    filter.teacherId = req.user._id;
  }

  const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 2000);
  const skip  = (Number(page) - 1) * pageSize;
  const total = await LessonPlan.countDocuments(filter);
  const items = await LessonPlan.find(filter)
    .populate("schoolClassId", "name")
    .populate("subjectId", "name")
    .populate("teacherId", "name email")
    .populate("sectionId", "name")
    .populate("reviewedBy", "name")
    .sort({ plannedDate: -1 })
    .skip(skip)
    .limit(pageSize);

  return res.json(new ApiResponse(200, { items, total, page: Number(page), limit: pageSize }, "Lesson plans fetched"));
});

export const getLessonPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await LessonPlan.findById(id)
    .populate("schoolClassId", "name")
    .populate("subjectId", "name")
    .populate("teacherId", "name email");

  if (!plan || !plan.isActive) throw new ApiError(404, "Lesson plan not found");
  assertSameSchool(req, plan);
  return res.json(new ApiResponse(200, plan, "Lesson plan fetched"));
});

export const updateLessonPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await LessonPlan.findById(id);
  if (!plan || !plan.isActive) throw new ApiError(404, "Lesson plan not found");
  assertSameSchool(req, plan);

  const userRole = req.userRole?.name || req.user?.role?.name;
  if (userRole === "Teacher" && String(plan.teacherId) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to update this lesson plan");
  }

  // Status moves are the author's (submit, withdraw, mark completed); approving and returning
  // are a reviewer's, through PATCH /:id/review.
  const isAuthor = String(plan.teacherId) === String(req.user._id);
  const next = req.body.status;
  if (next !== undefined && next !== plan.status) {
    if (!isAuthor || !(AUTHOR_MOVES[plan.status] || []).includes(next)) {
      throw new ApiError(400, ["approved", "returned"].includes(next)
        ? "A plan is approved or returned by a reviewer, not from the edit form"
        : `A ${plan.status} plan cannot be moved to ${next}`);
    }
  }
  const contentKeys = ["title", "objectives", "content", "teachingMethods", "resources", "assessment", "plannedDate", "duration"];
  const changesContent = contentKeys.some((k) => req.body[k] !== undefined && String(req.body[k]) !== String(plan[k]));
  if (changesContent && ["approved", "completed"].includes(plan.status)) {
    throw new ApiError(400, "An approved plan cannot be changed; it can only be marked completed");
  }
  contentKeys.forEach((key) => {
    if (req.body[key] !== undefined) plan[key] = req.body[key];
  });
  if (next !== undefined && next !== plan.status) {
    plan.status = next;
    if (next === "submitted") plan.submittedAt = new Date();
  }

  await plan.save();
  return res.json(new ApiResponse(200, plan, "Lesson plan updated"));
});

export const deleteLessonPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await LessonPlan.findById(id);
  if (!plan || !plan.isActive) throw new ApiError(404, "Lesson plan not found");
  assertSameSchool(req, plan);

  const userRole = req.userRole?.name || req.user?.role?.name;
  if (userRole === "Teacher" && String(plan.teacherId) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to delete this lesson plan");
  }

  plan.isActive = false;
  await plan.save();
  return res.json(new ApiResponse(200, {}, "Lesson plan deleted"));
});

/**
 * PATCH /lesson-plans/:id/review  body: { decision: "approve" | "return", comment }
 * A reviewer approves a submitted plan, or returns it to its author with what to change.
 */
export const reviewLessonPlan = asyncHandler(async (req, res) => {
  const { decision } = req.body || {};
  const comment = String(req.body?.comment || "").trim().slice(0, 1000);
  if (!["approve", "return"].includes(decision)) throw new ApiError(400, "decision must be approve or return");
  if (decision === "return" && !comment) throw new ApiError(400, "Say what should change when returning a plan");

  const plan = await LessonPlan.findById(req.params.id);
  if (!plan || !plan.isActive) throw new ApiError(404, "Lesson plan not found");
  assertSameSchool(req, plan);
  if (String(plan.teacherId) === String(req.user._id)) throw new ApiError(403, "Someone else must review your own plan");

  const updated = await LessonPlan.findOneAndUpdate(
    { _id: plan._id, status: "submitted" },
    { $set: {
      status: decision === "approve" ? "approved" : "returned",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      reviewComment: comment,
    } },
    { new: true }
  ).populate("reviewedBy", "name");
  if (!updated) throw new ApiError(409, `Only a submitted plan can be reviewed (this one is ${plan.status})`);
  return res.json(new ApiResponse(200, updated, decision === "approve" ? "Lesson plan approved" : "Lesson plan returned"));
});
