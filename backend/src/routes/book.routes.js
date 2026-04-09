import express from "express";
import {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook
} from "../controllers/book.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ Create a book (Only Admin & Teacher)
router.post("/", auth, roleMiddleware(["School Admin", "Teacher"]), createBook);

// ✅ Get all books (Accessible to all authenticated users)
router.get("/", auth, getAllBooks);

// ✅ Get a book by ID (Accessible to all authenticated users)
router.get("/:bookId", auth, getBookById);

// ✅ Update a book (Only Admin & Teacher)
router.put("/:bookId", auth, roleMiddleware(["School Admin", "Teacher"]), updateBook);

// ✅ Delete a book (Only Admin)
router.delete("/:bookId", auth, roleMiddleware(["School Admin"]), deleteBook);

export default router;
