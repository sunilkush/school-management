import mongoose from "mongoose";
import { Chapter } from "../models/Chapter.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createChapter = asyncHandler(async (req, res) => {
  const { name, chapterNo, description, schoolClassId, subjectId, isGlobal = false, schoolId } = req.body;

  const chapter = await Chapter.create({
    name: name.trim(),
    chapterNo,
    description,
    schoolClassId,
    subjectId,
    isGlobal,
    schoolId: isGlobal ? null : schoolId || req.user.schoolId || null,
    createdByRole: req.userRole?.name || req.user?.role || "School Admin",
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, chapter, "Chapter created successfully"));
});

const getAllChapters = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const filter = {};

  if (req.query.schoolClassId) filter.schoolClassId = req.query.schoolClassId;
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;

  const skip = (page - 1) * limit;
  const [chapters, total] = await Promise.all([
    Chapter.find(filter).sort({ chapterNo: 1 }).skip(skip).limit(limit),
    Chapter.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, chapters, "Chapters fetched successfully", { page, total, limit }));
});

const getChapterById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid chapter id");

  const chapter = await Chapter.findById(id);
  if (!chapter) throw new ApiError(404, "Chapter not found");

  return res.status(200).json(new ApiResponse(200, chapter, "Chapter fetched"));
});

const updateChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid chapter id");

  const chapter = await Chapter.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!chapter) throw new ApiError(404, "Chapter not found");

  return res.status(200).json(new ApiResponse(200, chapter, "Chapter updated"));
});

const deleteChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid chapter id");

  const chapter = await Chapter.findByIdAndUpdate(id, { isActive: false, status: "Inactive", updatedBy: req.user._id }, { new: true });
  if (!chapter) throw new ApiError(404, "Chapter not found");

  return res.status(200).json(new ApiResponse(200, null, "Chapter deleted successfully"));
});

const getVisibleChapters = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const filter = { isActive: true };
  const [chapters, total] = await Promise.all([
    Chapter.find(filter).skip(skip).limit(limit).sort({ chapterNo: 1 }),
    Chapter.countDocuments(filter),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, chapters, "Visible chapters fetched successfully", { page, total, limit }));
});

export { createChapter, getAllChapters, getChapterById, updateChapter, deleteChapter, getVisibleChapters };
