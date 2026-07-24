import mongoose from "mongoose";
import { Subject } from "../models/subject.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const isSuperAdmin = (req) => (req.userRole?.name || req.user?.role?.name) === "Super Admin";

// A School Admin editing/deleting a subject must only ever touch their own
// school's subjects (or, for Super Admin, the shared global catalog) — never
// another school's or the global catalog by ID-guessing.
const assertCanManageSubject = (req, subject) => {
  if (isSuperAdmin(req)) return;
  if (subject.isGlobal || `${subject.schoolId}` !== `${req.user.schoolId}`) {
    throw new ApiError(403, "Forbidden: this subject does not belong to your school");
  }
};

const createSubject = asyncHandler(async (req, res) => {
  const { name, category, type, maxMarks, passMarks, description } = req.body;

  const normalizedName = name.trim().toUpperCase();
  const global = isSuperAdmin(req);
  const schoolId = global ? null : req.user.schoolId;

  const exists = await Subject.findOne(
    global ? { name: normalizedName, isGlobal: true } : { name: normalizedName, schoolId }
  );
  if (exists) {
    throw new ApiError(400, "Subject with this name already exists");
  }

  const subject = await Subject.create({
    name: normalizedName,
    category,
    type,
    maxMarks,
    passMarks,
    description,
    isGlobal: global,
    schoolId,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, subject, "Subject created successfully"));
});

const getAllSubjects = asyncHandler(async (req, res) => {
    const parsedPage = Number.parseInt(req.query.page, 10);
  const parsedLimit = Number.parseInt(req.query.limit, 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
  const skip = (page - 1) * limit;

  const filter = isSuperAdmin(req) ? {} : { $or: [{ isGlobal: true }, { schoolId: req.user.schoolId }] };

  const [subjects, total] = await Promise.all([
    Subject.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subject.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, subjects, "Subjects fetched successfully", {
      page,
      total,
      limit,
       totalPages: Math.ceil(total / limit),
    })
  );
});

const getSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  const subject = await Subject.findById(id);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }
  if (!subject.isGlobal && !isSuperAdmin(req) && `${subject.schoolId}` !== `${req.user.schoolId}`) {
    throw new ApiError(403, "Forbidden: this subject does not belong to your school");
  }

  return res.status(200).json(new ApiResponse(200, subject, "Subject fetched successfully"));
});

const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  const existing = await Subject.findById(id);
  if (!existing) {
    throw new ApiError(404, "Subject not found");
  }
  assertCanManageSubject(req, existing);

  const updates = { ...req.body, updatedBy: req.user._id };
  delete updates.isGlobal;
  delete updates.schoolId;
  if (typeof updates.name === "string") {
    updates.name = updates.name.trim().toUpperCase();
  }

  const subject = await Subject.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  return res.status(200).json(new ApiResponse(200, subject, "Subject updated successfully"));
});

const assignSchoolsToSubject = asyncHandler(async (_req, _res) => {
  throw new ApiError(501, "Not implemented");
});

const assignTeachersToSubject = asyncHandler(async (_req, _res) => {
  throw new ApiError(501, "Not implemented");
});

const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  const existing = await Subject.findById(id);
  if (!existing) {
    throw new ApiError(404, "Subject not found");
  }
  assertCanManageSubject(req, existing);

  await existing.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Subject deleted successfully"));
});

export {
  createSubject,
  getSubject,
  getAllSubjects,
  updateSubject,
  assignSchoolsToSubject,
  assignTeachersToSubject,
  deleteSubject,
};
