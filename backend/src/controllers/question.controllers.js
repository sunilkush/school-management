import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Question } from "../models/Questions.model.js";
import mongoose from "mongoose";

// =============================
// Create Question
// =============================
export const createQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await Question.create(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, question, "Question created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Bulk Create (Excel/JSON Import)
// =============================
export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Questions array required"));
    }

    const created = await Question.insertMany(questions, { ordered: false });
    return res
      .status(201)
      .json(new ApiResponse(201, created, "Bulk questions created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Get Questions (Advanced Filtering + Pagination)
// =============================
export const getQuestions = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      difficulty,
      subjectId,
      schoolId,
      questionType,
      tags,
      search,
      sort = "-createdAt",
    } = req.query;

    const filters = {};
    if (difficulty) filters.difficulty = difficulty;
    if (subjectId) filters.subjectId = subjectId;
    if (schoolId) filters.schoolId = schoolId;
    if (questionType) filters.questionType = questionType;
    if (tags) filters.tags = { $in: tags.split(",") };
    if (search) filters.statement = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      Question.find(filters)
        .populate("subjectId schoolId createdBy")
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sort),
      Question.countDocuments(filters),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        questions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
      "Questions fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Get Single Question
// =============================
export const getQuestionById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid ID"));
    }

    const question = await Question.findById(id).populate("subjectId schoolId createdBy");
    if (!question) {
      return res.status(404).json(new ApiResponse(404, null, "Question not found"));
    }

    return res.status(200).json(new ApiResponse(200, question, "Question fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Update Question
// =============================
export const updateQuestion = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!question) {
      return res.status(404).json(new ApiResponse(404, null, "Question not found"));
    }

    return res.status(200).json(new ApiResponse(200, question, "Question updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Delete Question
// =============================
export const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json(new ApiResponse(404, null, "Question not found"));
    }

    return res.status(200).json(new ApiResponse(200, null, "Question deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Toggle Active/Inactive
// =============================
export const toggleQuestionStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) return res.status(404).json(new ApiResponse(404, null, "Question not found"));

    question.isActive = !question.isActive;
    await question.save();

    return res.status(200).json(new ApiResponse(200, question, `Question ${question.isActive ? "activated" : "deactivated"} successfully`));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});
