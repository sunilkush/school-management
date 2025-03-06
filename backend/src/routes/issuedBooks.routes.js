import express from "express";
import {
    issueBook,
    getAllIssuedBooks,
    getIssuedBooksForStudent,
    returnBook,
    deleteIssuedBook,
} from "../controllers/issuedBooks.controller.js";
import { auth, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// Define allowed roles
const ADMIN_TEACHER = ["admin", "teacher"];
const STUDENT_ROLE = ["student"];

// ✅ Issue a book (Only Admin & Teacher)
router.post("/issueBook", auth, roleMiddleware(ADMIN_TEACHER), issueBook);

// ✅ Get all issued books (Only Admin & Teacher)
router.get("/getAllIssuedBooks", auth, roleMiddleware(ADMIN_TEACHER), getAllIssuedBooks);

// ✅ Get issued books for a student (Only Student)
router.get("/my-books", auth, roleMiddleware(STUDENT_ROLE), getIssuedBooksForStudent);

// ✅ Return a book (Only Student)
router.put("/returnBook/:id", auth, roleMiddleware(STUDENT_ROLE), returnBook);

// ✅ Delete an issued book record (Only Admin)
router.delete("/deleteBooks/:id", auth, roleMiddleware(["admin"]), deleteIssuedBook);

export default router;
