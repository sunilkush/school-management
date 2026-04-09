import express from "express";
import {
    issueBook,
    getAllIssuedBooks,
    getIssuedBooksForStudent,
    returnBook,
    deleteIssuedBook
} from "../controllers/issuedBook.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ Issue a book (Only Admin & Teacher)
router.post("/issue", auth, roleMiddleware(["School Admin", "Teacher"]), issueBook);

// ✅ Get all issued books (Only Admin & Teacher)
router.get("/", auth, roleMiddleware(["School Admin", "Teacher"]), getAllIssuedBooks);

// ✅ Get issued books for a student (Only Student)
router.get("/student", auth, roleMiddleware(["Student"]), getIssuedBooksForStudent);

// ✅ Return a book (Only Student)
router.put("/return/:id", auth, roleMiddleware(["Student"]), returnBook);

// ✅ Delete issued book record (Only Admin)
router.delete("/:id", auth, roleMiddleware(["School Admin"]), deleteIssuedBook);

export default router;
