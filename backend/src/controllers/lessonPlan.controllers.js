import { LessonPlan } from "../models/LessonPlan.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

const isSuperAdmin = (req) => (req.userRole?.name || req.user?.role?.name) === "Super Admin";

const assertSameSchool = (req, plan) => {
  if (isSuperAdmin(req)) return;
  if (`${plan.schoolId}` !== `${getSchoolId(req)}`) {
    throw new ApiError(403, "Forbidden access outside your school");
  }
};

export const createLessonPlan = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const { academicYearId, schoolClassId, sectionId, subjectId, title, objectives, content, teachingMethods, resources, assessment, plannedDate, duration } = req.body;

  if (!academicYearId || !schoolClassId || !subjectId || !title || !plannedDate) {
    throw new ApiError(400, "academicYearId, schoolClassId, subjectId, title, and plannedDate are required");
  }

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
    status: "draft",
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

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await LessonPlan.countDocuments(filter);
  const items = await LessonPlan.find(filter)
    .populate("schoolClassId", "name")
    .populate("subjectId", "name")
    .populate("teacherId", "name email")
    .sort({ plannedDate: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }, "Lesson plans fetched"));
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

  const updatable = ["title", "objectives", "content", "teachingMethods", "resources", "assessment", "plannedDate", "duration", "status"];
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) plan[key] = req.body[key];
  });

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
