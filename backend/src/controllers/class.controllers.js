import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Class } from "../models/classes.model.js";
import mongoose from "mongoose";

/* =========================================================
   CREATE CLASS
========================================================= */
const createClass = asyncHandler(async (req, res) => {
  const { name, code, description, isGlobal, status } = req.body;

  if (!name) {
    throw new ApiError(400, "Class name is required");
  }

  const formattedName = name.trim().toUpperCase();

  const existingClass = await Class.findOne({ name: formattedName });

  if (existingClass) {
    throw new ApiError(400, "Class already exists");
  }

  const newClass = await Class.create({
    name: formattedName,
    code,
    description,
    isGlobal,
    status,
    createdBy: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newClass, "Class created successfully"));
});

/* =========================================================
   UPDATE CLASS
========================================================= */
const updateClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const classDoc = await Class.findById(classId);

  if (!classDoc) {
    throw new ApiError(404, "Class not found");
  }

  const { name, code, description, isGlobal, isActive, status } = req.body;

  if (name) classDoc.name = name.trim().toUpperCase();
  if (code) classDoc.code = code.trim();
  if (description) classDoc.description = description.trim();

  if (typeof isGlobal === "boolean") classDoc.isGlobal = isGlobal;
  if (typeof isActive === "boolean") classDoc.isActive = isActive;
  if (status) classDoc.status = status;

  classDoc.updatedBy = req.user?._id;

  await classDoc.save();

  return res
    .status(200)
    .json(new ApiResponse(200, classDoc, "Class updated successfully"));
});

/* =========================================================
   DELETE CLASS
========================================================= */
const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const deleted = await Class.findByIdAndDelete(classId);

  if (!deleted) {
    throw new ApiError(404, "Class not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Class deleted successfully"));
});

/* =========================================================
   GET ALL CLASSES
========================================================= */
const getAllClasses = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search, status } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const query = {};

  /* ===== SEARCH ===== */
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  /* ===== STATUS FILTER ===== */
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const total = await Class.countDocuments(query);

  const classes = await Class.find(query)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: classes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      "Classes fetched successfully"
    )
  );
});

/* =========================================================
   GET CLASS BY ID
========================================================= */
const getClassById = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new ApiError(400, "Invalid Class ID");
  }

  const classData = await Class.findById(classId)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!classData) {
    throw new ApiError(404, "Class not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, classData, "Class fetched successfully"));
});

export {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
  getClassById,
};