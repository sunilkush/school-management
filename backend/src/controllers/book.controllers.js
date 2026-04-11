import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Book } from "../models/Books.model.js";

// helper
const resolveSchoolId = (req) =>
  req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;

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

  // 🔹 ISBN unique check
  if (isbn) {
    const exists = await Book.findOne({ isbn });
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
  const schoolId = resolveSchoolId(req);

  const filter = schoolId ? { schoolId } : {};

  const books = await Book.find(filter)
    .populate("schoolId", "name")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, books, "Books fetched successfully"));
});

// ✅ GET SINGLE
export const getBookById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const book = await Book.findById(id).populate("schoolId", "name");

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

  // 🔹 ISBN duplicate check
  if (updates.isbn) {
    const exists = await Book.findOne({
      isbn: updates.isbn,
      _id: { $ne: id },
    });
    if (exists) throw new ApiError(400, "ISBN already exists");
  }

  const updatedBook = await Book.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!updatedBook) throw new ApiError(404, "Book not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBook, "Book updated successfully"));
});

// ✅ DELETE
export const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedBook = await Book.findByIdAndDelete(id);

  if (!deletedBook) throw new ApiError(404, "Book not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Book deleted successfully"));
});