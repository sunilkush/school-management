import express from "express";
import {
  issueBook,
  getAllIssuedBooks,
  getIssuedBooksForStudent,
  returnBook,
  collectFine,
  deleteIssuedBook,
  getLibraryDashboard,
  getOverdueBooks,
  getFineSummary,
} from "../controllers/issuedBook.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const LIBRARY_STAFF = ["School Admin", "Teacher", "Librarian"];

// Dashboard & Reports
router.get("/dashboard", auth, roleMiddleware(LIBRARY_STAFF), getLibraryDashboard);
router.get("/overdue",   auth, roleMiddleware(LIBRARY_STAFF), getOverdueBooks);
router.get("/fines",     auth, roleMiddleware(LIBRARY_STAFF), getFineSummary);

// CRUD
router.post  ("/issue",        auth, roleMiddleware(LIBRARY_STAFF), issueBook);
router.get   ("/",             auth, roleMiddleware(LIBRARY_STAFF), getAllIssuedBooks);
router.get   ("/student",      auth, roleMiddleware(["Student"]),   getIssuedBooksForStudent);
// Staff only. "Student" used to be allowed here, and returnBook only checks the school — so a
// student could mark any issued book, their own included, as returned without handing it back
// (freeing the copy and dodging the fine). No student screen returns books; the library does.
router.put   ("/return/:id",   auth, roleMiddleware(LIBRARY_STAFF), returnBook);
router.patch ("/:id/fine",     auth, roleMiddleware(LIBRARY_STAFF), collectFine);
router.delete("/:id",          auth, roleMiddleware(["School Admin", "Librarian"]), deleteIssuedBook);

export default router;
