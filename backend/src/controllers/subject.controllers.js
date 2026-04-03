import mongoose from "mongoose";
import { Subject } from "../models/subject.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createSubject = asyncHandler(async (req, res) => {
  const { name, category, type, maxMarks, passMarks, description } = req.body;

  const normalizedName = name.trim().toUpperCase();

  const exists = await Subject.findOne({ name: normalizedName });
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
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, subject, "Subject created successfully"));
});

const getAllSubjects = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const [subjects, total] = await Promise.all([
    Subject.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subject.countDocuments({}),
  ]);

  return res.status(200).json(
    new ApiResponse(200, subjects, "Subjects fetched successfully", {
      page,
      total,
      limit,
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

  return res.status(200).json(new ApiResponse(200, subject, "Subject fetched successfully"));
});

const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  const updates = { ...req.body, updatedBy: req.user._id };
  if (typeof updates.name === "string") {
    updates.name = updates.name.trim().toUpperCase();
  }

  const subject = await Subject.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

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

  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

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
