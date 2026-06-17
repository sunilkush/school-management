import { AdmissionInquiry } from "../models/AdmissionInquiry.model.js";
import { ApiError }          from "../utils/ApiError.js";
import { ApiResponse }       from "../utils/ApiResponse.js";
import { asyncHandler }      from "../utils/asyncHandler.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

/* ── CREATE ─────────────────────────────────────────────────────── */
export const createInquiry = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const {
    studentName, dateOfBirth, gender, applyingClass, academicYear,
    parentName, parentPhone, parentEmail, relationship, address,
    previousSchool, previousClass, source, notes, followUpDate, assignedTo,
  } = req.body;

  if (!studentName?.trim()) throw new ApiError(400, "Student name is required");
  if (!parentName?.trim())  throw new ApiError(400, "Parent name is required");
  if (!parentPhone?.trim()) throw new ApiError(400, "Parent phone is required");
  if (!applyingClass?.trim()) throw new ApiError(400, "Applying class is required");

  const inquiry = await AdmissionInquiry.create({
    schoolId, studentName: studentName.trim(), dateOfBirth, gender,
    applyingClass: applyingClass.trim(), academicYear,
    parentName: parentName.trim(), parentPhone: parentPhone.trim(),
    parentEmail, relationship, address,
    previousSchool, previousClass, source: source || "walk-in",
    notes, followUpDate, assignedTo: assignedTo || req.user._id,
  });

  res.status(201).json(new ApiResponse(201, inquiry, "Inquiry created"));
});

/* ── GET ALL (paginated) ─────────────────────────────────────────── */
export const getInquiries = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { status, search, source, page = 1, limit = 20 } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (search) {
    const re = new RegExp(search.trim(), "i");
    filter.$or = [
      { studentName: re },
      { parentName:  re },
      { parentPhone: re },
      { parentEmail: re },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [inquiries, total] = await Promise.all([
    AdmissionInquiry.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AdmissionInquiry.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { inquiries, total, page: Number(page), limit: Number(limit) }, "Fetched"));
});

/* ── GET ONE ─────────────────────────────────────────────────────── */
export const getInquiryById = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const inquiry  = await AdmissionInquiry.findOne({ _id: req.params.id, schoolId })
    .populate("assignedTo", "name email");
  if (!inquiry) throw new ApiError(404, "Inquiry not found");
  res.json(new ApiResponse(200, inquiry, "Fetched"));
});

/* ── UPDATE STATUS / NOTES ───────────────────────────────────────── */
export const updateInquiry = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const inquiry  = await AdmissionInquiry.findOne({ _id: req.params.id, schoolId });
  if (!inquiry) throw new ApiError(404, "Inquiry not found");

  const allowed = [
    "status", "notes", "followUpDate", "assignedTo",
    "parentPhone", "parentEmail", "address", "source",
    "studentName", "parentName", "applyingClass", "academicYear",
    "gender", "dateOfBirth", "previousSchool", "previousClass", "relationship",
  ];
  allowed.forEach((f) => { if (req.body[f] !== undefined) inquiry[f] = req.body[f]; });

  await inquiry.save();
  res.json(new ApiResponse(200, inquiry, "Updated"));
});

/* ── DELETE ──────────────────────────────────────────────────────── */
export const deleteInquiry = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const inquiry  = await AdmissionInquiry.findOne({ _id: req.params.id, schoolId });
  if (!inquiry) throw new ApiError(404, "Inquiry not found");
  await inquiry.deleteOne();
  res.json(new ApiResponse(200, null, "Deleted"));
});

/* ── STATS ───────────────────────────────────────────────────────── */
export const getInquiryStats = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const stats = await AdmissionInquiry.aggregate([
    { $match: { schoolId: schoolId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const result = {};
  stats.forEach((s) => { result[s._id] = s.count; });
  res.json(new ApiResponse(200, result, "Stats fetched"));
});
