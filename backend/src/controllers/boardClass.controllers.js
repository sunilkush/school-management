import { BoardClass } from "../models/BoardClass.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Class } from "../models/classes.model.js";
import mongoose from "mongoose";

const createBoardClass = asyncHandler(async (req, res) => {
  const { boardId, classId, status, description } = req.body;

  if (!boardId || !classId) {
    throw new ApiError(400, "Board ID and Class ID are required");
  }

  // ✅ Prevent duplicate
  const exists = await BoardClass.findOne({ boardId, classId });
  if (exists) {
    throw new ApiError(400, "This class already exists in this board");
  }

  // ✅ Auto name from Class (BEST PRACTICE)
  const classData = await Class.findById(classId);
  if (!classData) {
    throw new ApiError(404, "Class not found");
  }

  const boardClass = await BoardClass.create({
    boardId,
    classId,
    name: classData.name, // 🔥 auto set
    status,
    description,
    createdBy: req.user?._id,
  });

  return res.status(201).json(
    new ApiResponse(201, boardClass, "Board class created successfully")
  );
});



const getBoardClasses = asyncHandler(async (req, res) => {
  const { boardId } = req.query;

  // boardId is optional — when omitted, return board classes across all boards
  const filter = boardId ? { boardId } : {};

  const boardClasses = await BoardClass.find(filter)
    .populate("boardId", "name")
    .populate("classId", "name")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, boardClasses, "Board classes fetched successfully")
  );
});


const getBoardClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Board Class ID is required");
  }

  const boardClass = await BoardClass.findById(id)
    .populate("boardId", "name")
    .populate("classId", "name");

  if (!boardClass) {
    throw new ApiError(404, "Board class not found");
  }

  return res.status(200).json(
    new ApiResponse(200, boardClass, "Board class fetched successfully")
  );
});

const updateBoardClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, description } = req.body;

  if (!id) {
    throw new ApiError(400, "Board Class ID is required");
  }

  const updated = await BoardClass.findByIdAndUpdate(
    id,
    {
      status,
      description,
      updatedBy: req.user?._id,
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new ApiError(404, "Board class not found");
  }

  return res.status(200).json(
    new ApiResponse(200, updated, "Board class updated successfully")
  );
});

const deleteBoardClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Board Class ID is required");
  }

  const deleted = await BoardClass.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(404, "Board class not found");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Board class deleted successfully")
  );
});




export{ createBoardClass, getBoardClasses, updateBoardClass, deleteBoardClass,getBoardClassById };