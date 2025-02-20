import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IssuedBook } from "../models/IssuedBooks.model.js";
import { Book } from "../models/Books.model.js";

// @desc    Issue a book to a student (Admin & Teacher only)
// @route   POST /api/issued-books
export const issueBook = asyncHandler(async (req, res) => {
    try {
        const { schoolId, bookId, studentId, issueDate } = req.body;

        // Check if the book exists and is available
        const book = await Book.findById(bookId);
        if (!book) {
            throw new ApiError(404, "Book not found")

        }
        if (book.availableCopies <= 0) {
            throw new ApiError(400, "No available copies of the book.")

        }

        // Issue the book
        const issuedBook = new IssuedBook({
            schoolId,
            bookId,
            studentId,
            issueDate,
            status: "issued",
        });

        await issuedBook.save();

        // Reduce the available copies of the book
        book.availableCopies -= 1;
        await book.save();
        return res.status(200).json(
            new ApiResponse(200, issuedBook, "Book issued successfully")
        )

    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error")

    }
});

// @desc    Get all issued books (Admin & Teacher)
// @route   GET /api/issued-books
export const getAllIssuedBooks = asyncHandler(async (req, res) => {
    try {
        const issuedBooks = await IssuedBook.find()
            .populate("bookId", "title author")
            .populate("studentId", "name email")
            .populate("schoolId", "name");

        return res.status(200).json(
            new ApiResponse(200, issuedBooks, "issued Book Successfully !")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error");
    }
});

// @desc    Get issued books for a student (Student only)
// @route   GET /api/issued-books/my-books
export const getIssuedBooksForStudent = asyncHandler(async (req, res) => {
    try {
        const issuedBooks = await IssuedBook.find({ studentId: req.user._id })
            .populate("bookId", "title author")
            .populate("schoolId", "name");

        return res.status(200).json(
            new ApiResponse(200, issuedBooks, "Successfully issued Books")
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error");
    }
});

// @desc    Return a book (Student only)
// @route   PUT /api/issued-books/return/:id
export const returnBook = asyncHandler(async (req, res) => {
    try {
        const { studentId } = req.params
        const issuedBook = await IssuedBook.findById(studentId);

        if (!issuedBook) {

            throw new ApiError(404, "Issued book record not found")

        }

        if (issuedBook.status === "returned") {
            throw new ApiError(400, "Book is already returned")

        }

        if (issuedBook.studentId.toString() !== req.user._id.toString()) {

            throw new ApiError(403, "You are not authorized to return this book")
        }

        // Update book status
        issuedBook.status = "returned";
        issuedBook.returnDate = new Date();
        await issuedBook.save();

        // Increase the available copies of the book
        const book = await Book.findById(issuedBook.bookId);
        if (book) {
            book.availableCopies += 1;
            await book.save();
        }
        return res.status(200).json(
            new ApiResponse(200, issuedBook, "Book returned successfully")
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error");
    }
});

// @desc    Delete an issued book record (Admin only)
// @route   DELETE /api/issued-books/:id
export const deleteIssuedBook = asyncHandler(async (req, res) => {
    try {
        const { bookId } = req.params
        const issuedBook = await IssuedBook.findById(bookId);

        if (!issuedBook) {
            throw new ApiError(404, "Issued book record not found");
        }

        await issuedBook.deleteOne();
        return res.status(200).json(

            new ApiResponse(200, "Issued book record deleted successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error");
    }
});
