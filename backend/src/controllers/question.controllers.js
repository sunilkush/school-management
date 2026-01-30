import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Question } from "../models/Questions.model.js";
import * as XLSX from "xlsx";
import mongoose from "mongoose";

// =============================
// Create Question
// =============================
export const createQuestion = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log("User creating question:", user);
  if (!user || !user.schoolId?._id) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Unauthorized user"));
  }

  const {
    classId,
    subjectId,
    chapter,
    topic,
    questionType,
    statement,
    options = [],
    correctAnswers = [],
    difficulty,
    marks,
    negativeMarks,
    tags,
    isActive
  } = req.body;

  // 🔐 Basic required checks
  if (!classId || !subjectId || !questionType || !statement) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "classId, subjectId, questionType and statement are required"
        )
      );
  }

  // 🔍 ObjectId validation
  if (
    !mongoose.Types.ObjectId.isValid(classId) ||
    !mongoose.Types.ObjectId.isValid(subjectId)
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid classId or subjectId"));
  }

  const payload = {
    schoolId: user.schoolId._id,
    classId,
    subjectId,
    chapter,
    topic,
    questionType,
    statement,
    options,
    correctAnswers,
    difficulty,
    marks,
    negativeMarks,
    tags,
    isActive,
    createdBy: user._id
  };

  try {
    const question = await Question.create(payload);

    return res
      .status(201)
      .json(
        new ApiResponse(201, question, "Question created successfully")
      );
  } catch (error) {
    // 🧠 Mongoose validation errors (schema + pre-validate)
    if (error.name === "ValidationError" || error.message) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, error.message)
        );
    }

    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Internal Server Error")
      );
  }
});

// =============================
// Bulk Create Questions from Excel
// =============================
export const bulkCreateQuestionsFromExcel = asyncHandler(async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json(new ApiResponse(400, null, "Excel file required"));

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData.length)
      return res.status(400).json(new ApiResponse(400, null, "Excel sheet is empty"));

    const user = req.user;

    const questions = sheetData.map((row) => ({
      schoolId: user?.school?._id,
      subjectId: row.subjectId,
      chapter: row.chapter || "",
      topic: row.topic || "",
      questionType: row.questionType || "mcq_single",
      statement: row.statement,
      options: row.options ? JSON.parse(row.options) : [],
      correctAnswers: row.correctAnswers ? row.correctAnswers.split(",") : [],
      difficulty: row.difficulty || "medium",
      marks: Number(row.marks) || 1,
      negativeMarks: Number(row.negativeMarks) || 0,
      tags: row.tags ? row.tags.split(",").map((t) => t.trim().toLowerCase()) : [],
      createdBy: user._id,
    }));

    const created = await Question.insertMany(questions, { ordered: false });

    return res
      .status(201)
      .json(new ApiResponse(201, created, "Bulk questions created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// =============================
// Get Questions (filters + pagination + search)
// =============================
export const getQuestions = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    const {
      page = 1,
      limit = 10,
      difficulty,
      subjectId,
      questionType,
      tags,
      search,
      sort = "-createdAt",
    } = req.query;

    const filters = {};

    // Multi-tenant
    if (user.role !== "Super Admin") {
      filters.schoolId = user.schoolId;
    } else if (req.query.schoolId) {
      filters.schoolId = req.query.schoolId;
    }

    if (difficulty) filters.difficulty = difficulty;
    if (subjectId) filters.subjectId = subjectId;
    if (questionType) filters.questionType = questionType;
    if (tags) filters.tags = { $in: tags.split(",").map((t) => t.trim().toLowerCase()) };
    if (search) filters.statement = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      Question.find(filters)
        .populate("subjectId schoolId createdBy", "name")
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
      }, "Questions fetched successfully")
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

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json(new ApiResponse(400, null, "Invalid ID"));

    const question = await Question.findById(id).populate("subjectId schoolId createdBy", "name");
    if (!question) return res.status(404).json(new ApiResponse(404, null, "Question not found"));

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

    const question = await Question.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!question) return res.status(404).json(new ApiResponse(404, null, "Question not found"));

    return res.status(200).json(new ApiResponse(200, question, "Question updated successfully"));
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json(new ApiResponse(400, null, messages.join(", ")));
    }
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

    if (!question) return res.status(404).json(new ApiResponse(404, null, "Question not found"));

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
