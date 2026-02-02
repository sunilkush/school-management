import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Board from "../models/Board.model.js";
import mongoose from "mongoose";
import { School } from "../models/school.model.js";
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
  let { schoolId, boardIds } = req.body;

  /* ===============================
     ✅ BASIC VALIDATION
  =============================== */
  if (!schoolId) {
    throw new ApiError(400, "School ID is required");
  }

  if (!boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
    throw new ApiError(400, "Board IDs array is required");
  }

  /* ===============================
     ✅ OBJECT ID VALIDATION
  =============================== */
  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Invalid School ID");
  }

  // Validate all board ids
  for (const id of boardIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid board id: ${id}`);
    }
  }

  /* ===============================
     ✅ Convert to ObjectId
  =============================== */
  boardIds = boardIds.map((id) => new mongoose.Types.ObjectId(id));

  /* ===============================
     ✅ Check School Exists
  =============================== */
  const school = await School.findById(schoolId);
  if (!school) {
    throw new ApiError(404, "School not found");
  }

  /* ===============================
     ✅ Check Boards Exist
  =============================== */
  const boards = await Board.find({ _id: { $in: boardIds } });

  if (boards.length !== boardIds.length) {
    throw new ApiError(400, "Some boards are invalid");
  }

  /* ===============================
     ✅ Remove Duplicate Boards
  =============================== */
  const existingBoards = (school.boards || []).map((b) => b.toString());

  const newBoards = boardIds.filter(
    (id) => !existingBoards.includes(id.toString())
  );

  /* ===============================
     ✅ Assign Boards
  =============================== */
  school.boards = [
    ...(school.boards || []),
    ...newBoards,
  ];

  await school.save();

  /* ===============================
     ✅ Populate Response
  =============================== */
  const updatedSchool = await School.findById(schoolId)
    .populate("boardIds", "name code")
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedSchool,
      "Boards assigned to school successfully"
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
