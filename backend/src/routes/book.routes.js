import { Router } from "express";
import { 
    issueBook, 
    returnBook, 
    getIssuedBooks, 
    getIssuedBookById 
} from "../controllers/issuedBook.controller.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Define roles
const ADMIN_LIBRARIAN = ["Super Admin", "Admin", "Librarian"];
const STUDENT_PARENT = ["Student", "Parent"];

// ✅ Issued Book Routes (Protected)
router.post("/", auth, roleMiddleware(ADMIN_LIBRARIAN), issueBook);
router.put("/return/:id", auth, roleMiddleware(ADMIN_LIBRARIAN), returnBook);
router.get("/", auth, roleMiddleware([...ADMIN_LIBRARIAN, ...STUDENT_PARENT]), getIssuedBooks);
router.get("/:id", auth, roleMiddleware([...ADMIN_LIBRARIAN, ...STUDENT_PARENT]), getIssuedBookById);

export default router;
