import mongoose from "mongoose";
import { Department } from "../models/Department.model.js";
import { Designation } from "../models/Designation.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";
import { escapeRegex } from "../utils/escapeRegex.js";

/**
 * The page sent its status as "Active"/"Inactive" while the model only accepts lower case, so
 * every new department was refused with a validation error. Either spelling is taken now.
 */
const normaliseStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const status = String(value).trim().toLowerCase();
  if (!["active", "inactive"].includes(status)) throw new ApiError(400, "Status must be active or inactive");
  return status;
};

/**
 * Departments made on the Super Admin's page have no school: they are the platform's list, meant
 * for every school. A school's own users were shown only departments carrying their school's id,
 * so that list never reached them. They now see it, alongside any made for their school alone.
 */
const visibleFilter = (req, extra = {}) => {
  const filter = buildSchoolAccessFilter(req, extra);
  const schoolId = filter.schoolId || req.query?.schoolId;
  if (schoolId) filter.schoolId = { $in: [schoolId, null] };
  return filter;
};

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
    status: normaliseStatus(status) || "active",
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, department, "Department created successfully"));
});

/* ── GET ALL ─────────────────────────────────────────────────────────────── */
export const getDepartments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;

  const filter = visibleFilter(req);
  const wantedStatus = normaliseStatus(status);
  if (wantedStatus) filter.status = wantedStatus;
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };

  const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 1000);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * pageSize;
  const [departments, total] = await Promise.all([
    Department.find(filter)
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Department.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, { departments, total, page: Number(page), limit: pageSize }, "Departments fetched")
  );
});

/* ── GET BY ID ───────────────────────────────────────────────────────────── */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const dept = await Department.findOne(visibleFilter(req, { _id: req.params.id })).populate("schoolId", "name");
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
  const newStatus = normaliseStatus(status);
  if (newStatus) dept.status = newStatus;
  dept.updatedBy = req.user._id;

  await dept.save();
  res.status(200).json(new ApiResponse(200, dept, "Department updated successfully"));
});

/* ── DELETE ──────────────────────────────────────────────────────────────── */
// Deleting a department that designations or staff point at left them pointing at nothing, and
// their profiles showed a blank department. Such a department is kept; marking it inactive
// takes it out of the pickers without touching anyone's record.
export const deleteDepartment = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(400, "Invalid department id");
  const dept = await Department.findById(req.params.id);
  if (!dept) throw new ApiError(404, "Department not found");

  const [designations, staff] = await Promise.all([
    Designation.countDocuments({ departmentId: dept._id }),
    User.countDocuments({ departmentId: dept._id }),
  ]);
  const usedBy = [
    [designations, "designation", "designations"],
    [staff, "staff member", "staff members"],
  ].filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  if (usedBy.length) {
    throw new ApiError(409, `${dept.name} is used by ${usedBy.join(" and ")}. Mark it inactive instead — it stays on their records.`);
  }

  await dept.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Department deleted successfully"));
});
