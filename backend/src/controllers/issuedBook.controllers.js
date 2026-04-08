import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IssuedBook } from "../models/IssuedBooks.model.js";
import { Book } from "../models/Books.model.js";

// ✅ Issue a book (Only Admin & Teacher)
export const issueBook = asyncHandler(async (req, res) => {
    const { schoolId, bookId, studentId, issueDate, dueDate } = req.body;

    if (!studentId) throw new ApiError(400, "studentId is required");

    // Check if the book exists and is available
    const book = await Book.findById(bookId);
    if (!book) throw new ApiError(404, "Book not found");
    if (book.availableCopies <= 0) throw new ApiError(400, "No available copies of the book.");

    // Issue the book
    const issuedBook = await IssuedBook.create({
        schoolId,
        bookId,
        studentId,
        issueDate,
         dueDate,
        status: "Issued",
    });

    // Reduce available copies
    book.availableCopies -= 1;
    await book.save();

    res.status(201).json(new ApiResponse(201, issuedBook, "Book issued successfully"));
});

// ✅ Get all issued books (Only Admin & Teacher)
export const getAllIssuedBooks = asyncHandler(async (req, res) => {
    const issuedBooks = await IssuedBook.find()
        .populate("bookId", "title author")
        .populate({
            path: "studentId",
            select: "userId",
            populate: {
                path: "userId",
                select: "name email",
            },
        })
        .populate("schoolId", "name");

    const issuedBooksWithStudentDetails = issuedBooks.map((issuedBook) => {
        const issuedBookObject = issuedBook.toObject();
        issuedBookObject.studentName = issuedBookObject.studentId?.userId?.name || null;
        issuedBookObject.studentEmail = issuedBookObject.studentId?.userId?.email || null;

        return issuedBookObject;
    });

    res.status(200).json(new ApiResponse(200, issuedBooksWithStudentDetails, "Issued books retrieved successfully"));
});

// ✅ Get issued books for a student (Only Student)
export const getIssuedBooksForStudent = asyncHandler(async (req, res) => {
    const issuedBooks = await IssuedBook.find({ studentId: req.user._id })
        .populate("bookId", "title author")
        .populate("schoolId", "name")
         .populate("studentId", "name email")

    res.status(200).json(new ApiResponse(200, issuedBooks, "Issued books retrieved successfully"));
});

// ✅ Return a book (Only Student)
export const returnBook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const issuedBook = await IssuedBook.findById(id);

    if (!issuedBook) throw new ApiError(404, "Issued book record not found");
    if (issuedBook.status === "Returned") throw new ApiError(400, "Book is already returned");
     // Update book status
    issuedBook.status = "Returned";
    issuedBook.returnDate = new Date();
    await issuedBook.save();

    // Increase available copies
    const book = await Book.findById(issuedBook.bookId);
    if (book) {
        book.availableCopies += 1;
        await book.save();
    }

    res.status(200).json(new ApiResponse(200, issuedBook, "Book returned successfully"));
});

// ✅ Delete issued book record (Only Admin)
export const deleteIssuedBook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const issuedBook = await IssuedBook.findById(id);

    if (!issuedBook) throw new ApiError(404, "Issued book record not found");

    await issuedBook.deleteOne();
    res.status(200).json(new ApiResponse(200, null, "Issued book record deleted successfully"));
});
