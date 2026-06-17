import { Designation } from "../models/Designation.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ── CREATE ──────────────────────────────────────────────────────────────── */
export const createDesignation = asyncHandler(async (req, res) => {
  const { title, level, departmentId, description, schoolId, status } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Designation title is required");

  const designation = await Designation.create({
    title: title.trim(),
    level: level || "Mid",
    departmentId: departmentId || null,
    description: description?.trim(),
    schoolId: schoolId || null,
    status: status || "active",
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, designation, "Designation created successfully"));
});

/* ── GET ALL ─────────────────────────────────────────────────────────────── */
export const getDesignations = asyncHandler(async (req, res) => {
  const { schoolId, status, level, page = 1, limit = 20, search } = req.query;

  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (status) filter.status = status;
  if (level) filter.level = level;
  if (search) filter.title = { $regex: search, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const [designations, total] = await Promise.all([
    Designation.find(filter)
      .populate("departmentId", "name")
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Designation.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, { designations, total, page: Number(page), limit: Number(limit) }, "Designations fetched")
  );
});

/* ── GET BY ID ───────────────────────────────────────────────────────────── */
export const getDesignationById = asyncHandler(async (req, res) => {
  const desig = await Designation.findById(req.params.id)
    .populate("departmentId", "name")
    .populate("schoolId", "name");
  if (!desig) throw new ApiError(404, "Designation not found");
  res.status(200).json(new ApiResponse(200, desig, "Designation fetched"));
});

/* ── UPDATE ──────────────────────────────────────────────────────────────── */
export const updateDesignation = asyncHandler(async (req, res) => {
  const desig = await Designation.findById(req.params.id);
  if (!desig) throw new ApiError(404, "Designation not found");

  const { title, level, departmentId, description, status } = req.body;
  if (title) desig.title = title.trim();
  if (level) desig.level = level;
  if (departmentId !== undefined) desig.departmentId = departmentId || null;
  if (description !== undefined) desig.description = description?.trim();
  if (status) desig.status = status;
  desig.updatedBy = req.user._id;

  await desig.save();
  res.status(200).json(new ApiResponse(200, desig, "Designation updated successfully"));
});

/* ── DELETE ──────────────────────────────────────────────────────────────── */
export const deleteDesignation = asyncHandler(async (req, res) => {
  const desig = await Designation.findById(req.params.id);
  if (!desig) throw new ApiError(404, "Designation not found");
  await desig.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Designation deleted successfully"));
});
