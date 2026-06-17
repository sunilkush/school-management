import { Department } from "../models/Department.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ── CREATE ──────────────────────────────────────────────────────────────── */
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, head, description, schoolId, status } = req.body;

  if (!name?.trim()) throw new ApiError(400, "Department name is required");

  const exists = await Department.findOne({
    name: name.trim(),
    schoolId: schoolId || null,
  });
  if (exists) throw new ApiError(409, "Department with this name already exists");

  const department = await Department.create({
    name: name.trim(),
    code: code?.trim().toUpperCase(),
    head: head?.trim(),
    description: description?.trim(),
    schoolId: schoolId || null,
    status: status || "active",
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, department, "Department created successfully"));
});

/* ── GET ALL ─────────────────────────────────────────────────────────────── */
export const getDepartments = asyncHandler(async (req, res) => {
  const { schoolId, status, page = 1, limit = 20, search } = req.query;

  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const [departments, total] = await Promise.all([
    Department.find(filter)
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Department.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, { departments, total, page: Number(page), limit: Number(limit) }, "Departments fetched")
  );
});

/* ── GET BY ID ───────────────────────────────────────────────────────────── */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id).populate("schoolId", "name");
  if (!dept) throw new ApiError(404, "Department not found");
  res.status(200).json(new ApiResponse(200, dept, "Department fetched"));
});

/* ── UPDATE ──────────────────────────────────────────────────────────────── */
export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) throw new ApiError(404, "Department not found");

  const { name, code, head, description, status } = req.body;
  if (name) dept.name = name.trim();
  if (code !== undefined) dept.code = code?.trim().toUpperCase();
  if (head !== undefined) dept.head = head?.trim();
  if (description !== undefined) dept.description = description?.trim();
  if (status) dept.status = status;
  dept.updatedBy = req.user._id;

  await dept.save();
  res.status(200).json(new ApiResponse(200, dept, "Department updated successfully"));
});

/* ── DELETE ──────────────────────────────────────────────────────────────── */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) throw new ApiError(404, "Department not found");
  await dept.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Department deleted successfully"));
});
