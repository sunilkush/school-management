import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Book } from "../models/Books.model.js";
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";

const isSuperAdmin = (req) =>
  (req.userRole?.name || "").toLowerCase().replace(/\s+/g, "_") === "super_admin";

// Only Super Admin may target another school; everyone else is pinned to their own.
const resolveSchoolId = (req) =>
  isSuperAdmin(req) ? req.body?.schoolId || req.query?.schoolId || req.user?.schoolId : req.user?.schoolId;

// ✅ CREATE
export const createBook = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);

  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const {
    title,
    author,
    publisher,
    isbn,
    category,
    totalCopies,
    availableCopies,
    shelfLocation,
    academicYearId,
  } = req.body;

  // 🔹 validation
  if (!title || !author || !publisher || !category || !shelfLocation) {
    throw new ApiError(400, "Required fields missing");
  }

  // 🔹 ISBN unique check — scoped to this school. Two different schools cataloguing the same
  // real-world book (identical ISBN) is normal, not a duplicate — matches the compound
  // {schoolId, isbn} unique index on the model.
  if (isbn) {
    const exists = await Book.findOne({ isbn, schoolId });
    if (exists) throw new ApiError(400, "Book with this ISBN already exists");
  }

  const book = await Book.create({
    schoolId,
    academicYearId: academicYearId || null,
    title,
    author,
    publisher,
    isbn,
    category,
    totalCopies: Number(totalCopies) || 1,
    availableCopies:
      availableCopies !== undefined
        ? Number(availableCopies)
        : Number(totalCopies) || 1,
    shelfLocation,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, book, "Book created successfully"));
});

// ✅ GET ALL
export const getAllBooks = asyncHandler(async (req, res) => {
  const filter = buildSchoolAccessFilter(req);

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 2000);
  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Book.countDocuments(filter),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, books, "Books fetched successfully", {
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }));
});

// ✅ GET SINGLE
export const getBookById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const book = await Book.findOne(buildSchoolAccessFilter(req, { _id: id })).populate(
    "schoolId",
    "name"
  );

  if (!book) throw new ApiError(404, "Book not found");

  return res
    .status(200)
    .json(new ApiResponse(200, book, "Book fetched successfully"));
});

// ✅ UPDATE
export const updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updates = {};

  const fields = [
    "title",
    "author",
    "publisher",
    "isbn",
    "category",
    "totalCopies",
    "availableCopies",
    "shelfLocation",
    "academicYearId",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // 🔹 ISBN duplicate check — scoped the same way the update itself is below.
  if (updates.isbn) {
    const exists = await Book.findOne(
      buildSchoolAccessFilter(req, { isbn: updates.isbn, _id: { $ne: id } })
    );
    if (exists) throw new ApiError(400, "ISBN already exists");
  }

  const updatedBook = await Book.findOneAndUpdate(
    buildSchoolAccessFilter(req, { _id: id }),
    updates,
    { new: true, runValidators: true }
  );

  if (!updatedBook) throw new ApiError(404, "Book not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBook, "Book updated successfully"));
});

// ✅ DELETE
export const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedBook = await Book.findOneAndDelete(buildSchoolAccessFilter(req, { _id: id }));

  if (!deletedBook) throw new ApiError(404, "Book not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Book deleted successfully"));
});