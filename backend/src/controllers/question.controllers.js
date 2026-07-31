import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Question } from "../models/Questions.model.js";
import * as XLSX from "xlsx";
import mongoose from "mongoose";
import { escapeRegex } from "../utils/escapeRegex.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";

// =============================
// Create Question
// =============================
export const createQuestion = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Unauthorized user"));
  }

  // Super Admin has no schoolId of their own (they aren't tied to one school), so the school
  // they're adding this question for has to come from the request — same pattern getQuestions
  // already uses for cross-school reads.
  const isSuperAdmin = (req.userRole?.name || req.user?.role?.name || req.user?.roleId?.name) === "Super Admin";
  const schoolId = isSuperAdmin ? req.body.schoolId : resolveSchoolId(user);

  if (!schoolId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, isSuperAdmin ? "schoolId is required" : "Unauthorized user"));
  }

  const {
    schoolClassId,
    subjectId,
    chapterId,
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
  if (!schoolClassId || !subjectId || !questionType || !statement) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "schoolClassId, subjectId, questionType and statement are required"
        )
      );
  }

  // 🔍 ObjectId validation
  if (
    !mongoose.Types.ObjectId.isValid(schoolClassId) ||
    !mongoose.Types.ObjectId.isValid(subjectId)
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid schoolClassId or subjectId"));
  }

  const payload = {
    schoolId,
    schoolClassId,
    subjectId,
    chapterId: chapterId || chapter || null,
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
    const user = req.user;
    const isSuperAdmin = (req.userRole?.name || req.user?.role?.name || req.user?.roleId?.name) === "Super Admin";
    const schoolId = isSuperAdmin ? req.body.schoolId : resolveSchoolId(user);
    if (!schoolId) {
      return res
        .status(isSuperAdmin ? 400 : 401)
        .json(new ApiResponse(isSuperAdmin ? 400 : 401, null, isSuperAdmin ? "schoolId is required" : "Unauthorized user"));
    }
    let rows = [];

    if (req.file) {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (Array.isArray(req.body?.questions)) {
      rows = req.body.questions;
    } else {
      return res.status(400).json(
        new ApiResponse(400, null, "Provide excel file or questions array")
      );
    }

    if (!rows.length) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Questions payload is empty"));
    }

    const questions = rows.map((row) => ({
      schoolId,
      subjectId: row.subjectId,
      schoolClassId: row.schoolClassId,
      chapterId: row.chapterId || row.chapter || null,
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
      schoolClassId,
      chapterId,
      sort = "-createdAt",
    } = req.query;

    const filters = {};

    // Multi-tenant
    if (user?.roleId?.name !== "Super Admin") {
      filters.schoolId = user?.schoolId?._id || user?.schoolId;
    } else if (req.query.schoolId) {
      filters.schoolId = req.query.schoolId;
    }

    if (difficulty) filters.difficulty = difficulty;
    if (subjectId) filters.subjectId = subjectId;
    if (questionType) filters.questionType = questionType;
    if (schoolClassId) filters.schoolClassId = schoolClassId;
    if (chapterId) filters.chapterId = chapterId;
    if (tags) filters.tags = { $in: tags.split(",").map((t) => t.trim().toLowerCase()) };
    if (search) filters.statement = { $regex: escapeRegex(search), $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      Question.find(filters)
        .populate("subjectId schoolId schoolClassId chapterId createdBy", "name")
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

    const question = await Question.findById(id).populate("subjectId schoolId schoolClassId chapterId createdBy", "name");
    if (!question) return res.status(404).json(new ApiResponse(404, null, "Question not found"));
    if (req.user?.roleId?.name !== "Super Admin") {
      const requesterSchoolId = req.user?.schoolId?._id || req.user?.schoolId;
      if (`${question.schoolId?._id || question.schoolId}` !== `${requesterSchoolId}`) {
        return res.status(403).json(new ApiResponse(403, null, "Forbidden"));
      }
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
    const existing = await Question.findById(id).select("schoolId");
    if (!existing) return res.status(404).json(new ApiResponse(404, null, "Question not found"));
    if (req.user?.roleId?.name !== "Super Admin") {
      const requesterSchoolId = req.user?.schoolId?._id || req.user?.schoolId;
      if (`${existing.schoolId}` !== `${requesterSchoolId}`) {
        return res.status(403).json(new ApiResponse(403, null, "Forbidden"));
      }
    }

    const question = await Question.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

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
    const existing = await Question.findById(id).select("schoolId");
    if (!existing) return res.status(404).json(new ApiResponse(404, null, "Question not found"));
    if (req.user?.roleId?.name !== "Super Admin") {
      const requesterSchoolId = req.user?.schoolId?._id || req.user?.schoolId;
      if (`${existing.schoolId}` !== `${requesterSchoolId}`) {
        return res.status(403).json(new ApiResponse(403, null, "Forbidden"));
      }
    }
    const question = await Question.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, question, "Question deleted successfully"));
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
    if (req.user?.roleId?.name !== "Super Admin") {
      const requesterSchoolId = req.user?.schoolId?._id || req.user?.schoolId;
      if (`${question.schoolId}` !== `${requesterSchoolId}`) {
        return res.status(403).json(new ApiResponse(403, null, "Forbidden"));
      }
    }

    question.isActive = !question.isActive;
    await question.save();

    return res.status(200).json(new ApiResponse(200, question, `Question ${question.isActive ? "activated" : "deactivated"} successfully`));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});
