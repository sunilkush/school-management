import { BoardClass } from "../models/BoardClass.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createBoardClass = asyncHandler(async (req, res) => {
    // Implementation for creating a board class
    const { name, boardId, status, description, createdBy} = req.body;

    if (!name || !boardId) {
        throw new ApiError(400, "Name, Board ID and Class ID are required");
    }

    const boardClass = await BoardClass.create({
        name,
        boardId,
        status,
        description,
        createdBy,
    });

    if (!boardClass) {
        throw new ApiError(500, "Failed to create board class");
    }

    return res.status(201).json(
        new ApiResponse(201, boardClass, "Board class created successfully")
    )

});




const getBoardClasses = asyncHandler(async (req, res) => {
  const { boardId } = req.query;

  const pipeline = [];

  // ✅ Filter
  if (boardId) {
    pipeline.push({
      $match: {
        boardId: new mongoose.Types.ObjectId(boardId),
      },
    });
  }

  // ✅ Join Board
  pipeline.push({
    $lookup: {
      from: "boards",
      localField: "boardId",
      foreignField: "_id",
      as: "board",
    },
  });

  pipeline.push({
    $unwind: "$board",
  });

  // ✅ Final Output
  pipeline.push({
    $project: {
      _id: 1,
      boardId: 1,
      status: 1,
      name:1,
      boardName: "$board.name",
      boardState: "$board.state",
    },
  });

  const boardClasses = await BoardClass.aggregate(pipeline);

  return res.status(200).json(
    new ApiResponse(200, boardClasses, "Board classes fetched successfully")
  );
});
const getBoardClassById = asyncHandler(async (req, res) => {
    // Implementation for fetching a single board class by ID
    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "Board Class ID is required");
    }
    const boardClass = await BoardClass.findById(id);
    if (!boardClass) {
        throw new ApiError(404, "Board class not found");
    }
    return res.status(200).json(
        new ApiResponse(200, boardClass, "Board class fetched successfully")
    );
});

const updateBoardClass = asyncHandler(async (req, res) => {
    // Implementation for updating a board class
    const { id } = req.params;
    const { name, status, description, updatedBy } = req.body;
    
    if(!id) {
        throw new ApiError(400, "Board Class ID is required");
    }
    if (!name && !status && !description) {
        throw new ApiError(400, "At least one field (name, status, description) is required to update");
    }

    const boardClass = await BoardClass.findById(id);
    if (!boardClass) {
        throw new ApiError(404, "Board class not found");
    }

    const updateData = await BoardClass.findByIdAndUpdate(
        id,
        { name, status, description, updatedBy },
        { new: true, runValidators: true }
    );

    if (!updateData) {
        throw new ApiError(500, "Failed to update board class");
    }

    return res.status(200).json(
        new ApiResponse(200, updateData, "Board class updated successfully")    
    );
   

});

const deleteBoardClass = asyncHandler(async (req, res) => {
    // Implementation for deleting a board class
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Board Class ID is required");
    }

    const boardClass = await BoardClass.findById(id);
    if (!boardClass) {
        throw new ApiError(404, "Board class not found");
    }

    await BoardClass.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, null, "Board class deleted successfully")
    );
});




export{ createBoardClass, getBoardClasses, updateBoardClass, deleteBoardClass,getBoardClassById };