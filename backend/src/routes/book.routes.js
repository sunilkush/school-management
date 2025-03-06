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
router.post("/", auth, roleMiddleware(["admin", "teacher"]), createBook);

// ✅ Get all books (Accessible to all authenticated users)
router.get("/", auth, getAllBooks);

// ✅ Get a book by ID (Accessible to all authenticated users)
router.get("/:bookId", auth, getBookById);

// ✅ Update a book (Only Admin & Teacher)
router.put("/:bookId", auth, roleMiddleware(["admin", "teacher"]), updateBook);

// ✅ Delete a book (Only Admin)
router.delete("/:bookId", auth, roleMiddleware(["admin"]), deleteBook);

export default router;
