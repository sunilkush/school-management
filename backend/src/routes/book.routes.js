import { Router } from 'express';
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';
import {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook
} from '../controllers/book.controllers.js';

const router = Router()

router.post("/createBook", auth, roleMiddleware("Admin", "Teacher"), createBook); // Admin & Teacher can create books
router.get("/allBooks", auth, getAllBooks); // All users can view books
router.get("/:id", auth, getBookById); // All users can view a book
router.put("/update/:id", auth, roleMiddleware("Admin", "Teacher"), updateBook); // Admin & Teacher can update books
router.delete("/delete/:id", auth, roleMiddleware("Admin"), deleteBook); // Only Admin can delete books


export default router 