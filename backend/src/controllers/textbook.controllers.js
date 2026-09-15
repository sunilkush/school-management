import mongoose from "mongoose";
import { Textbook } from "../models/Textbook.model.js";
import { Chapter } from "../models/Chapter.model.js";
// Registered here because this file populates them; relying on some other route having loaded them
// first works only as long as that import order never changes.
import "../models/subject.model.js";
import "../models/Board.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Textbooks, class-wise and subject-wise, with each chapter's official PDF.
 *
 * Reading is open to everyone in a school: the books are the same for every school and every file
 * lives on the publisher's site. The one write — giving a chapter its title — is Super Admin's.
 */

const optionalId = (value, label) => {
  if (value == null || value === "") return null;
  if (!mongoose.Types.ObjectId.isValid(value)) throw new ApiError(400, `Invalid ${label}`);
  return new mongoose.Types.ObjectId(value);
};

/**
 * GET /textbooks?classNo=&subjectId=&boardId=&boardClassId=&withChapters=true
 * The books; their chapters only when asked for (a class's full list is small, a school's is not).
 */
export const getTextbooks = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  if (req.query.classNo != null && req.query.classNo !== "") {
    const classNo = Number(req.query.classNo);
    if (!Number.isInteger(classNo) || classNo < 1 || classNo > 12) throw new ApiError(400, "classNo must be 1–12");
    filter.classNo = classNo;
  }
  const subjectId = optionalId(req.query.subjectId, "subjectId");
  if (subjectId) filter.subjectId = subjectId;
  const boardId = optionalId(req.query.boardId, "boardId");
  if (boardId) filter.boardId = boardId;
  const boardClassId = optionalId(req.query.boardClassId, "boardClassId");
  if (boardClassId) filter.boardClassId = boardClassId;

  // Chapters come along only for a narrowed-down request, never for an unfiltered list.
  const withChapters = req.query.withChapters === "true" && (boardClassId || filter.classNo);

  const books = await Textbook.find(filter)
    .select(withChapters ? "" : "-chapters")
    .populate("subjectId", "name")
    .populate("boardId", "name code")
    .sort({ classNo: 1, order: 1, title: 1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, books, "Textbooks fetched"));
});

/** GET /textbooks/:id — one book and its chapters, in the book's own order. */
export const getTextbookById = asyncHandler(async (req, res) => {
  const id = optionalId(req.params.id, "textbook id");
  const book = await Textbook.findOne({ _id: id, isActive: true })
    .populate("subjectId", "name")
    .populate("boardId", "name code")
    .lean();
  if (!book) throw new ApiError(404, "Textbook not found");

  const chapters = [...(book.chapters || [])].sort((a, b) => a.bookChapterNo - b.bookChapterNo);
  return res.status(200).json(new ApiResponse(200, { ...book, chapters }, "Textbook fetched"));
});

/**
 * PATCH /textbooks/:id/chapters/:bookChapterNo  { name }   (Super Admin)
 *
 * Gives a book's chapter its title. Some books' titles could not be read at import (a scanned
 * Contents page, or a Hindi/Sanskrit font whose text comes out broken), so they arrived as
 * "Chapter N" and were kept out of the curriculum. Naming one here makes it a real curriculum
 * chapter — numbered after the class+subject's existing chapters, linked to the book and its PDF —
 * so it shows up for question banks and lesson plans. Renaming an already-linked chapter renames
 * both.
 */
export const nameTextbookChapter = asyncHandler(async (req, res) => {
  const id = optionalId(req.params.id, "textbook id");
  const bookChapterNo = Number(req.params.bookChapterNo);
  if (!Number.isInteger(bookChapterNo) || bookChapterNo < 1) throw new ApiError(400, "Invalid chapter number");

  const name = typeof req.body?.name === "string" ? req.body.name.replace(/\s+/g, " ").trim() : "";
  if (name.length < 2 || name.length > 150) throw new ApiError(400, "Chapter name must be 2–150 characters");

  const book = await Textbook.findOne({ _id: id, isActive: true });
  if (!book) throw new ApiError(404, "Textbook not found");
  const entry = book.chapters.find((c) => c.bookChapterNo === bookChapterNo);
  if (!entry) throw new ApiError(404, "This book has no such chapter");

  let chapter = entry.chapterId ? await Chapter.findById(entry.chapterId) : null;
  if (chapter) {
    chapter.name = name;
    chapter.updatedBy = req.user._id;
    await chapter.save();
  } else {
    // Next free number for this class+subject. Inactive chapters keep their numbers (the unique
    // index counts them), so they are included when looking for the highest.
    const last = await Chapter.findOne({
      boardClassId: book.boardClassId,
      subjectId: book.subjectId,
      isGlobal: true,
      chapterNo: { $lt: 1000 },
    })
      .sort({ chapterNo: -1 })
      .select("chapterNo")
      .lean();
    chapter = await Chapter.create({
      name,
      chapterNo: (last?.chapterNo || 0) + 1,
      boardClassId: book.boardClassId,
      subjectId: book.subjectId,
      isGlobal: true,
      schoolId: null,
      textbookId: book._id,
      bookChapterNo,
      pdfUrl: entry.pdfUrl,
      createdBy: req.user._id,
      createdByRole: "Super Admin",
    });
  }

  entry.name = name;
  entry.nameVerified = true;
  entry.chapterId = chapter._id;
  await book.save();

  return res.status(200).json(new ApiResponse(200, { entry, chapter }, "Chapter named"));
});
