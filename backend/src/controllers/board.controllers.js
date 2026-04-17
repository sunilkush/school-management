import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Board from "../models/Board.model.js";
import mongoose from "mongoose";
import { School } from "../models/school.model.js";
import{SchoolBoard} from "../models/School_board.model.js";
/* =====================================================
   CREATE BOARD
===================================================== */
export const createBoard = asyncHandler(async (req, res) => {
  const {  name, code, description, createdByRole } =
    req.body;

  if ( !name || !createdByRole) {
    throw new ApiError(400, "Required fields missing");
  }

  // Duplicate Check
  const existingBoard = await Board.findOne({
    name: name.trim(),
  });

  if (existingBoard) {
    throw new ApiError(409, "Board already exists for this academic year");
  }

  const board = await Board.create({
   
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

  const { search = "" } = req.query;

  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const boards = await Board.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        boards,
        total: boards.length,
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




export const assignSchoolBoards = asyncHandler(async (req, res) => {
  const { schoolId, boardId } = req.body;
  console.log(req.body)
  if (!schoolId || !boardId) {
    throw new ApiError(400, "School ID and Board ID are required");
  }

  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Invalid School ID");
  }

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    throw new ApiError(400, "Invalid Board ID");
  }

  // ✅ upsert (duplicate nahi banega)
  const schoolBoard = await SchoolBoard.findOneAndUpdate(
    { schoolId, boardId },
    {
      schoolId,
      boardId,
      assignedBy: req.user?._id,
      assignedByRole: req.user?.role || "School Admin",
      isActive: true,
      isPrimary:true
    },
    { new: true, upsert: true }
  );

  return res.status(200).json(
    new ApiResponse(200, schoolBoard, "Board assigned successfully")
  );
});

export const getSchoolBoards = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Invalid school id");
  }

  // ✅ correct query
  const schoolBoards = await SchoolBoard.find({ schoolId })
    .populate("boardId", "name code") // 🔥 important
    .sort({ createdAt: -1 });

  if (!schoolBoards.length) {
    return res.status(200).json(
      new ApiResponse(200, [], "No boards assigned to this school")
    );
    
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      schoolBoards,
      "School Boards Fetch Successfully!"
    )
  );
});

export const removeSchoolBoard = asyncHandler(async (req, res) => {
  const { schoolId, boardId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Invalid school id");
  }

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    throw new ApiError(400, "Invalid board id");
  }

  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  school.boards = (school.boards || []).filter(
    (b) => b.toString() !== boardId
  );

  await school.save();

  return res.status(200).json(
    new ApiResponse(200, school, "Board removed successfully")
  );
});
