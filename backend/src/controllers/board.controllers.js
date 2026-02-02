import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Board from "../models/Board.model.js";
import mongoose from "mongoose";

/* =====================================================
   CREATE BOARD
===================================================== */
export const createBoard = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, name, code, description, createdByRole } =
    req.body;

  if (!schoolId || !academicYearId || !name || !createdByRole) {
    throw new ApiError(400, "Required fields missing");
  }

  // Duplicate Check
  const existingBoard = await Board.findOne({
    schoolId,
    academicYearId,
    name: name.trim(),
  });

  if (existingBoard) {
    throw new ApiError(409, "Board already exists for this academic year");
  }

  const board = await Board.create({
    schoolId,
    academicYearId,
    name: name.trim(),
    code: code?.trim(),
    description,
    createdByRole,
    createdBy: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, board, "Board created successfully"));
});

/* =====================================================
   GET ALL BOARDS (Pagination + Search + Filter)
===================================================== */
export const getBoards = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    schoolId,
    academicYearId,
  } = req.query;

  const query = {};

  if (schoolId) query.schoolId = schoolId;
  if (academicYearId) query.academicYearId = academicYearId;

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [boards, total] = await Promise.all([
    Board.find(query)
      .populate("schoolId", "name")
      .populate("academicYearId", "year")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Board.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        boards,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      "Boards fetched successfully"
    )
  );
});

/* =====================================================
   GET BOARD BY ID
===================================================== */
export const getBoardById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid board id");
  }

  const board = await Board.findById(id)
    .populate("schoolId", "name")
    .populate("academicYearId", "year")
    .populate("createdBy", "name email");

  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, board, "Board fetched successfully"));
});

/* =====================================================
   UPDATE BOARD
===================================================== */
export const updateBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid board id");
  }

  const allowedUpdates = [
    "name",
    "code",
    "description",
    "academicYearId",
  ];

  const updateData = {};

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const board = await Board.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, board, "Board updated successfully"));
});

/* =====================================================
   DELETE BOARD
===================================================== */
export const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid board id");
  }

  const board = await Board.findByIdAndDelete(id);

  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, true, "Board deleted successfully"));
});
