import { CounselingSession } from "../models/CounselingSession.model.js";
import { ApiError }          from "../utils/ApiError.js";
import { ApiResponse }       from "../utils/ApiResponse.js";
import { asyncHandler }      from "../utils/asyncHandler.js";
import { escapeRegex }       from "../utils/escapeRegex.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

export const createSession = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { studentId, studentName, studentClass, type, issue, sessionDate, duration, notes, followUpDate, mood } = req.body;
  if (!issue?.trim())   throw new ApiError(400, "Issue is required");
  if (!sessionDate)     throw new ApiError(400, "Session date is required");

  const session = await CounselingSession.create({
    schoolId, studentId, studentName, studentClass,
    counselorId: req.user._id,
    type: type || "Session",
    issue: issue.trim(),
    sessionDate: new Date(sessionDate),
    duration: Number(duration) || 30,
    notes, followUpDate, mood,
    status: "Scheduled",
  });

  res.status(201).json(new ApiResponse(201, session, "Session created"));
});

export const getSessions = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { type, status, search, page = 1, limit = 50 } = req.query;
  const filter = { schoolId };
  if (type)   filter.type   = type;
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ studentName: re }, { issue: re }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [sessions, total] = await Promise.all([
    CounselingSession.find(filter)
      .populate("counselorId", "name")
      .sort({ sessionDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    CounselingSession.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { sessions, total, page: Number(page) }, "Fetched"));
});

export const updateSession = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const session = await CounselingSession.findOne({ _id: req.params.id, schoolId });
  if (!session) throw new ApiError(404, "Session not found");

  const fields = ["status", "notes", "followUpDate", "mood", "duration", "issue", "sessionDate", "type", "studentName", "studentClass"];
  fields.forEach((f) => { if (req.body[f] !== undefined) session[f] = req.body[f]; });
  await session.save();

  res.json(new ApiResponse(200, session, "Updated"));
});

export const deleteSession = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const session = await CounselingSession.findOne({ _id: req.params.id, schoolId });
  if (!session) throw new ApiError(404, "Session not found");
  await session.deleteOne();
  res.json(new ApiResponse(200, null, "Deleted"));
});

export const getSessionStats = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const stats = await CounselingSession.aggregate([
    { $match: { schoolId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const issues = await CounselingSession.aggregate([
    { $match: { schoolId } },
    { $group: { _id: "$issue", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  const result = {};
  stats.forEach((s) => { result[s._id] = s.count; });
  res.json(new ApiResponse(200, { byStatus: result, topIssues: issues }, "Stats fetched"));
});
