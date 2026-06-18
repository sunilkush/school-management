import { HostelComplaint } from "../models/HostelComplaint.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) =>
  req.user?.schoolId?._id || req.user?.schoolId || req.user?.school?._id;

// POST /hostel/complaints
export const createComplaint = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { studentId, type, title, description, priority, roomNumber, academicYearId } = req.body;

  if (!studentId || !type || !title || !description) {
    throw new ApiError(400, "studentId, type, title and description are required");
  }

  const complaint = await HostelComplaint.create({
    schoolId, studentId, type, title, description,
    priority: priority || "medium",
    roomNumber: roomNumber || "",
    academicYearId: academicYearId || null,
  });

  await complaint.populate("studentId", "name admissionNo");

  return res.status(201).json(new ApiResponse(201, complaint, "Complaint submitted"));
});

// GET /hostel/complaints
export const getAllComplaints = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { status, type, priority, studentId, page = 1, limit = 25 } = req.query;

  const filter = { schoolId };
  if (status)    filter.status    = status;
  if (type)      filter.type      = type;
  if (priority)  filter.priority  = priority;
  if (studentId) filter.studentId = studentId;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await HostelComplaint.countDocuments(filter);

  const complaints = await HostelComplaint.find(filter)
    .populate("studentId", "name admissionNo")
    .populate("resolvedBy", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const summary = await HostelComplaint.aggregate([
    { $match: { schoolId: filter.schoolId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return res.json(new ApiResponse(200, { complaints, total, summary }, "Complaints fetched"));
});

// GET /hostel/complaints/:id
export const getComplaintById = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const complaint = await HostelComplaint.findOne({ _id: req.params.id, schoolId })
    .populate("studentId", "name admissionNo phone")
    .populate("resolvedBy", "name");
  if (!complaint) throw new ApiError(404, "Complaint not found");
  return res.json(new ApiResponse(200, complaint, "Complaint fetched"));
});

// PUT /hostel/complaints/:id
export const updateComplaint = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { status, assignedTo, resolution, priority, note } = req.body;

  const complaint = await HostelComplaint.findOne({ _id: req.params.id, schoolId });
  if (!complaint) throw new ApiError(404, "Complaint not found");

  const prevStatus = complaint.status;
  if (status)     complaint.status     = status;
  if (assignedTo) complaint.assignedTo = assignedTo;
  if (resolution) complaint.resolution = resolution;
  if (priority)   complaint.priority   = priority;

  if (status === "resolved" || status === "closed") {
    complaint.resolvedAt = new Date();
    complaint.resolvedBy = req.user._id;
  }

  if (prevStatus !== status || note) {
    complaint.actionHistory.push({
      action: status || prevStatus,
      note: note || `Status changed to ${status}`,
      by: req.user._id,
      at: new Date(),
    });
  }

  await complaint.save();
  await complaint.populate("studentId", "name admissionNo");

  return res.json(new ApiResponse(200, complaint, "Complaint updated"));
});

// DELETE /hostel/complaints/:id
export const deleteComplaint = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const complaint = await HostelComplaint.findOneAndDelete({ _id: req.params.id, schoolId });
  if (!complaint) throw new ApiError(404, "Complaint not found");
  return res.json(new ApiResponse(200, null, "Complaint deleted"));
});
