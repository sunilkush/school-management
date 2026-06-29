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

const LIBRARY_STAFF = ["School Admin", "Teacher", "Librarian"];

router.post("/", auth, roleMiddleware(LIBRARY_STAFF), createBook);
router.get("/", auth, getAllBooks);
router.get("/:id", auth, getBookById);
router.put("/:id", auth, roleMiddleware(LIBRARY_STAFF), updateBook);
router.delete("/:id", auth, roleMiddleware(["School Admin", "Librarian"]), deleteBook);

export default router;
