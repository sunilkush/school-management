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
router.post("/issue", auth, roleMiddleware(["admin", "teacher"]), issueBook);

// ✅ Get all issued books (Only Admin & Teacher)
router.get("/", auth, roleMiddleware(["admin", "teacher"]), getAllIssuedBooks);

// ✅ Get issued books for a student (Only Student)
router.get("/student", auth, roleMiddleware(["student"]), getIssuedBooksForStudent);

// ✅ Return a book (Only Student)
router.put("/return/:id", auth, roleMiddleware(["student"]), returnBook);

// ✅ Delete issued book record (Only Admin)
router.delete("/:id", auth, roleMiddleware(["admin"]), deleteIssuedBook);

export default router;
