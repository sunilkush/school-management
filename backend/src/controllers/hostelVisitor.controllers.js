import { HostelVisitor } from "../models/HostelVisitor.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) =>
  req.user?.schoolId?._id || req.user?.schoolId || req.user?.school?._id;

// POST /hostel/visitors
export const logVisitorEntry = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { studentId, visitorName, visitorPhone, relation, purpose, idType, idNumber, notes } = req.body;

  if (!studentId || !visitorName || !visitorPhone || !relation || !purpose) {
    throw new ApiError(400, "studentId, visitorName, visitorPhone, relation and purpose are required");
  }

  const visitor = await HostelVisitor.create({
    schoolId, studentId, visitorName, visitorPhone, relation, purpose,
    idType: idType || "", idNumber: idNumber || "",
    notes: notes || "", approvedBy: req.user._id,
  });

  await visitor.populate("studentId", "name admissionNo");

  return res.status(201).json(new ApiResponse(201, visitor, "Visitor entry logged"));
});

// GET /hostel/visitors
export const getAllVisitors = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { status, studentId, date, page = 1, limit = 25 } = req.query;

  const filter = { schoolId };
  if (status)    filter.status    = status;
  if (studentId) filter.studentId = studentId;
  if (date) {
    const d = new Date(date);
    filter.createdAt = {
      $gte: new Date(d.setHours(0, 0, 0, 0)),
      $lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await HostelVisitor.countDocuments(filter);

  const visitors = await HostelVisitor.find(filter)
    .populate("studentId", "name admissionNo")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const visitorsToday = await HostelVisitor.countDocuments({
    schoolId, createdAt: { $gte: todayStart, $lte: todayEnd },
  });

  return res.json(new ApiResponse(200, { visitors, total, visitorsToday }, "Visitors fetched"));
});

// GET /hostel/visitors/:id
export const getVisitorById = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const visitor = await HostelVisitor.findOne({ _id: req.params.id, schoolId })
    .populate("studentId", "name admissionNo")
    .populate("approvedBy", "name");
  if (!visitor) throw new ApiError(404, "Visitor record not found");
  return res.json(new ApiResponse(200, visitor, "Visitor fetched"));
});

// PUT /hostel/visitors/:id/exit  — mark visitor exit
export const logVisitorExit = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const visitor = await HostelVisitor.findOne({ _id: req.params.id, schoolId });
  if (!visitor) throw new ApiError(404, "Visitor record not found");
  if (visitor.status === "exited") throw new ApiError(409, "Visitor has already exited");

  visitor.exitTime = req.body.exitTime ? new Date(req.body.exitTime) : new Date();
  visitor.status   = "exited";
  await visitor.save();

  return res.json(new ApiResponse(200, visitor, "Visitor exit logged"));
});

// DELETE /hostel/visitors/:id
export const deleteVisitorLog = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const visitor = await HostelVisitor.findOneAndDelete({ _id: req.params.id, schoolId });
  if (!visitor) throw new ApiError(404, "Visitor record not found");
  return res.json(new ApiResponse(200, null, "Visitor log deleted"));
});
