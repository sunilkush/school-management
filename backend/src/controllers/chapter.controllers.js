import mongoose from "mongoose";
import { Chapter } from "../models/Chapter.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { Textbook } from "../models/Textbook.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";
const chapterPopulate = [
  { path: "boardClassId", populate: [{ path: "boardId", select: "name" }, { path: "classId", select: "name" }] },
  { path: "subjectId", select: "name shortName" },
];

const isSuperAdmin = (req) => (req.userRole?.name || req.user?.role?.name) === "Super Admin";

const assertChapterReadAccess = (req, chapter) => {
  if (isSuperAdmin(req) || chapter.isGlobal) return;
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  if (`${chapter.schoolId}` !== `${schoolId}`) {
    throw new ApiError(403, "Forbidden access outside your school");
  }
};

const assertChapterWriteAccess = (req, chapter) => {
  if (isSuperAdmin(req)) return;
  if (chapter.isGlobal) throw new ApiError(403, "Only Super Admin can modify global chapters");
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  if (`${chapter.schoolId}` !== `${schoolId}`) {
    throw new ApiError(403, "Forbidden access outside your school");
  }
};

const formatChapter = (chapterDoc) => {
  const chapter = chapterDoc?.toObject ? chapterDoc.toObject() : chapterDoc;
  const boardClass = chapter?.boardClassId;

  return {
    ...chapter,
    board: boardClass?.boardId || null,
    class: boardClass?.classId || null,
    subject: chapter?.subjectId || null,
  };
};
const createChapter = asyncHandler(async (req, res) => {
  const {
    name,
    chapterNo,
    description,
    schoolClassId,
    boardClassId: incomingBoardClassId,
    subjectId,
    isGlobal = false,
    schoolId,
  } = req.body;
  const boardClassId = incomingBoardClassId || schoolClassId;

  if (!boardClassId) {
    throw new ApiError(400, "boardClassId or schoolClassId is required");
  }

  const chapter = await Chapter.create({
    name: name.trim(),
    chapterNo,
    description,
    boardClassId,
    subjectId,
    isGlobal,
    schoolId: isGlobal ? null : schoolId || req.user.schoolId || null,
    createdByRole: req.userRole?.name || req.user?.role || "School Admin",
    createdBy: req.user._id,
  });

  const populatedChapter = await Chapter.findById(chapter._id).populate(chapterPopulate);

  return res.status(201).json(new ApiResponse(201, formatChapter(populatedChapter), "Chapter created successfully"));
});

const getAllChapters = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.boardClassId) {
    // Chapter.boardClassId references BoardClass directly — trust the caller.
    filter.boardClassId = req.query.boardClassId;
  } else if (req.query.schoolClassId) {
    // Callers like the Question Bank UI only know a SchoolClass id (a different collection —
    // SchoolClass._id is not interchangeable with the BoardClass id Chapter is actually keyed
    // on), so resolve it via SchoolClass.boardClassId first. Without this, the filter compared a
    // SchoolClass id against Chapter.boardClassId and could never match, silently returning zero
    // chapters for every class+subject combination.
    const schoolClass = await SchoolClass.findById(req.query.schoolClassId).select("boardClassId");
    filter.boardClassId = schoolClass?.boardClassId || new mongoose.Types.ObjectId();
  }

  if (req.query.subjectId) {
    filter.subjectId = req.query.subjectId;
  }

  if (req.query.isGlobal !== undefined) {
    filter.isGlobal = req.query.isGlobal === "true";
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search?.trim()) {
    filter.name = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
  }

  // ✅ Direct fetch without pagination
  const chapters = await Chapter.find(filter)
    .sort({ chapterNo: 1, createdAt: -1 })
    .populate(chapterPopulate);

  return res.status(200).json(
    new ApiResponse(
      200,
      chapters.map(formatChapter),
      "Chapters fetched successfully"
    )
  );
});

const getChapterById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid chapter id");

   const chapter = await Chapter.findById(id).populate(chapterPopulate);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  assertChapterReadAccess(req, chapter);

  return res.status(200).json(new ApiResponse(200, formatChapter(chapter), "Chapter fetched"));
});

const updateChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid chapter id");

  const existing = await Chapter.findById(id);
  if (!existing) throw new ApiError(404, "Chapter not found");
  assertChapterWriteAccess(req, existing);

  // The guard above only decides whether you may touch THIS chapter; it said nothing about which
  // fields. The raw body then went straight into the update, so a School Admin editing their own
  // chapter could send `isGlobal: true` — the very thing assertChapterWriteAccess reserves for
  // Super Admin — or a different `schoolId`, moving the chapter into another school's syllabus.
  // Ownership and scope are Super Admin's to change, never a school's.
  const updates = { ...req.body };
  if (!isSuperAdmin(req)) {
    delete updates.isGlobal;
    delete updates.schoolId;
  }
  delete updates.createdBy;
  delete updates.createdByRole;

  // The textbook link is set by import and by naming a book's chapter, never by a plain edit.
  delete updates.textbookId;
  delete updates.bookChapterNo;
  delete updates.pdfUrl;

  const chapter = await Chapter.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate(chapterPopulate);
  if (!chapter) throw new ApiError(404, "Chapter not found");

  // A chapter that is also a textbook chapter carries its title in two places; keep them the same,
  // or the Textbooks page and the curriculum would name one chapter two ways.
  if (chapter.textbookId && typeof updates.name === "string" && updates.name.trim()) {
    await Textbook.updateOne(
      { _id: chapter.textbookId, "chapters.chapterId": chapter._id },
      { $set: { "chapters.$.name": chapter.name, "chapters.$.nameVerified": true } }
    );
  }

  return res.status(200).json(new ApiResponse(200, formatChapter(chapter), "Chapter updated"));
});

const deleteChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid chapter id");

  const existing = await Chapter.findById(id);
  if (!existing) throw new ApiError(404, "Chapter not found");
  assertChapterWriteAccess(req, existing);

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
    Chapter.find(filter).skip(skip).limit(limit).sort({ chapterNo: 1 }).populate(chapterPopulate),
    Chapter.countDocuments(filter),
  ]);

  return res
    .status(200)
     .json(
      new ApiResponse(200, chapters.map(formatChapter), "Visible chapters fetched successfully", { page, total, limit })
    );
});

export { createChapter, getAllChapters, getChapterById, updateChapter, deleteChapter, getVisibleChapters };
