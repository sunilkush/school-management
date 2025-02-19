import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Book } from "../models/Books.model.js";

const createBook = asyncHandler(async (req, res) => {
    try {
        const { schoolId, title, author, ISBN, availableCopies } = req.body;

        if ([schoolId, title, author, ISBN, availableCopies].some((filed) => filed?.trim() === "")) {
            throw new ApiError(400, "All fields are required.")
        }

        const bookExists = await Book.findOne({ ISBN });
        if (bookExists) {
            throw new ApiError(400, "Book with this ISBN already exists.")
        }
        const book = new Book({ schoolId, title, author, ISBN, availableCopies });

        const createBook = await book.save();

        if (!createBook) {
            throw new ApiError(400, "Book not found !")
        }

        return res.status(201).json(
            ApiResponse(200, createBook, "Book Add Successfully !")
        )

    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error")
    }
})

const getAllBooks = asyncHandler(async (req, res) => {
    try {
        const books = await Book.find().populate("schoolId", "name");

        return res.status(200).json(
            ApiResponse(200, books, "Get Books Successfully !")
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error")
    }
})

const getBookById = asyncHandler(async (req, res) => {
    try {
        const { bookId } = req.params
        const book = await Book.findById(bookId).populate("schoolId", "name");

        if (!book) {
            throw new ApiError(400, "Book not found")
        }

        return res.status(200).json(
            new ApiResponse(200, book, "Book find Successfully !")
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error")
    }
})

const updateBook = asyncHandler(async (req, res) => {
    try {
        const { bookId } = req.params
        const { schoolId, title, author, ISBN, availableCopies } = req.body;

        if ([schoolId, title, author, ISBN, availableCopies].some((filed) => filed?.trim() === "")) {
            throw new ApiError(400, "All fields are required.")
        }

        const updetedBook = await Book.findByIdAndUpdate(bookId, {
            schoolId, title, author, ISBN, availableCopies
        }, { new: true });

        if (!updetedBook) {
            throw new ApiError(400, "book not found !")
        }

        return res.status(200).json(
            ApiResponse(200, updateBook, "Book Updated successfully!")
        )

    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error")
    }
})

const deleteBook = asyncHandler(async (req, res) => {
    try {

        const { bookId } = req.params
        const bookDelete = await Book.findByIdAndDelete(bookId)
        if (!bookDelete) {
            throw new ApiError(400, "Book Not Found !")
        }
        await bookDelete.deleteOne();

        return res.status(200).json(
            new ApiResponse(200, bookDelete, "Book Delete Successfully !")
        )

    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error");
    }
})

export {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook
}