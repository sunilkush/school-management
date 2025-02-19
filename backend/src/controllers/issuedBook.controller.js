import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IssuedBook } from "../models/IssuedBooks.model.js";
import { Book } from "../models/Books.model.js";

// @desc    Issue a book to a student (Admin & Teacher only)
// @route   POST /api/issued-books
export const issueBook = async (req, res) => {
    try {
        const { schoolId, bookId, studentId, issueDate } = req.body;

        // Check if the book exists and is available
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        if (book.availableCopies <= 0) {
            return res.status(400).json({ message: "No available copies of the book." });
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

        res.status(201).json({ message: "Book issued successfully", issuedBook });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// @desc    Get all issued books (Admin & Teacher)
// @route   GET /api/issued-books
export const getAllIssuedBooks = async (req, res) => {
    try {
        const issuedBooks = await IssuedBook.find()
            .populate("bookId", "title author")
            .populate("studentId", "name email")
            .populate("schoolId", "name");

        res.status(200).json(issuedBooks);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// @desc    Get issued books for a student (Student only)
// @route   GET /api/issued-books/my-books
export const getIssuedBooksForStudent = async (req, res) => {
    try {
        const issuedBooks = await IssuedBook.find({ studentId: req.user._id })
            .populate("bookId", "title author")
            .populate("schoolId", "name");

        res.status(200).json(issuedBooks);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// @desc    Return a book (Student only)
// @route   PUT /api/issued-books/return/:id
export const returnBook = async (req, res) => {
    try {
        const issuedBook = await IssuedBook.findById(req.params.id);

        if (!issuedBook) {
            return res.status(404).json({ message: "Issued book record not found" });
        }

        if (issuedBook.status === "returned") {
            return res.status(400).json({ message: "Book is already returned" });
        }

        if (issuedBook.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to return this book" });
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

        res.status(200).json({ message: "Book returned successfully", issuedBook });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// @desc    Delete an issued book record (Admin only)
// @route   DELETE /api/issued-books/:id
export const deleteIssuedBook = async (req, res) => {
    try {
        const issuedBook = await IssuedBook.findById(req.params.id);

        if (!issuedBook) {
            return res.status(404).json({ message: "Issued book record not found" });
        }

        await issuedBook.deleteOne();
        res.status(200).json({ message: "Issued book record deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};
