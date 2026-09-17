import mongoose from "mongoose";
import { Designation } from "../models/Designation.model.js";
import { Department } from "../models/Department.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const isSuperAdmin = (req) => (req.userRole?.name || req.user?.roleId?.name) === "Super Admin";

/** "Active" from the page and "active" from the model are the same status (see department.controllers.js). */
const normaliseStatus = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const status = String(value).trim().toLowerCase();
  if (!["active", "inactive"].includes(status)) throw new ApiError(400, "Status must be active or inactive");
  return status;
};

/**
 * Designations with no school are the platform's list for every school; a school's users see
 * those as well as their own (they used to see only their own, so the platform list never
 * reached them).
 */
const schoolScope = (req) => {
  const schoolId = isSuperAdmin(req) ? req.query.schoolId : req.user.schoolId;
  return schoolId ? { schoolId: { $in: [schoolId, null] } } : {};
};

/**
 * A designation's department has to exist, and has to be one its school can use: the platform's
 * own departments, or its school's. The id was stored unchecked before.
 */
const checkDepartment = async (departmentId, schoolId) => {
  if (!departmentId) return null;
  if (!mongoose.Types.ObjectId.isValid(departmentId)) throw new ApiError(400, "Invalid department");
  const department = await Department.findById(departmentId).select("schoolId name");
  if (!department) throw new ApiError(400, "That department does not exist");
  if (department.schoolId && String(department.schoolId) !== String(schoolId || "")) {
    throw new ApiError(400, `${department.name} belongs to another school`);
  }
  return department._id;
};

/* ── CREATE ──────────────────────────────────────────────────────────────── */
export const createDesignation = asyncHandler(async (req, res) => {
  const { title, level, departmentId, description, schoolId, status } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Designation title is required");

  const designation = await Designation.create({
    title: title.trim(),
    level: level || "Mid",
    departmentId: await checkDepartment(departmentId, schoolId),
    description: description?.trim(),
    schoolId: schoolId || null,
    status: normaliseStatus(status) || "active",
    createdBy: req.user._id,
  });
  // The page shows the department's name straight away; an unpopulated id showed nothing.
  await designation.populate("departmentId", "name");

  res.status(201).json(new ApiResponse(201, designation, "Designation created successfully"));
});

/* ── GET ALL ─────────────────────────────────────────────────────────────── */
export const getDesignations = asyncHandler(async (req, res) => {
  const { status, level, departmentId, page = 1, limit = 20, search } = req.query;

  // Non-Super-Admin is always locked to their own school (and the platform list) — leaving this
  // unscoped when req.query.schoolId is omitted let School Admin list every school's designations.
  const filter = schoolScope(req);
  const wantedStatus = normaliseStatus(status);
  if (wantedStatus) filter.status = wantedStatus;
  if (level) filter.level = level;
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) filter.departmentId = departmentId;
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

  const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 1000);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * pageSize;
  const [designations, total] = await Promise.all([
    Designation.find(filter)
      .populate("departmentId", "name")
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Designation.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, { designations, total, page: Number(page), limit: pageSize }, "Designations fetched")
  );
});

/* ── GET BY ID ───────────────────────────────────────────────────────────── */
export const getDesignationById = asyncHandler(async (req, res) => {
  // findById had no schoolId scoping at all, despite School Admin (not just Super Admin) being
  // allowed to call this route — any school's designation could be viewed by ID.
  const query = isSuperAdmin(req)
    ? { _id: req.params.id }
    : { _id: req.params.id, schoolId: { $in: [req.user.schoolId, null] } };
  const desig = await Designation.findOne(query)
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
  if (departmentId !== undefined) desig.departmentId = await checkDepartment(departmentId, desig.schoolId);
  if (description !== undefined) desig.description = description?.trim();
  const newStatus = normaliseStatus(status);
  if (newStatus) desig.status = newStatus;
  desig.updatedBy = req.user._id;

  await desig.save();
  await desig.populate("departmentId", "name");
  res.status(200).json(new ApiResponse(200, desig, "Designation updated successfully"));
});

/* ── DELETE ──────────────────────────────────────────────────────────────── */
// A designation on staff profiles is kept rather than deleted out from under them.
export const deleteDesignation = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(400, "Invalid designation id");
  const desig = await Designation.findById(req.params.id);
  if (!desig) throw new ApiError(404, "Designation not found");

  const staff = await User.countDocuments({ designationId: desig._id });
  if (staff) {
    throw new ApiError(
      409,
      `${desig.title} is on ${staff} staff member${staff === 1 ? "'s profile" : "s' profiles"}. Mark it inactive instead — it stays on their records.`
    );
  }

  await desig.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Designation deleted successfully"));
});
