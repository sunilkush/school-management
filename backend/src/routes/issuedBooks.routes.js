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
router.put   ("/return/:id",   auth, roleMiddleware([...LIBRARY_STAFF, "Student"]), returnBook);
router.patch ("/:id/fine",     auth, roleMiddleware(LIBRARY_STAFF), collectFine);
router.delete("/:id",          auth, roleMiddleware(["School Admin", "Librarian"]), deleteIssuedBook);

export default router;
