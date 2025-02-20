import { Router } from "express";
import {
    issueBook,
    getAllIssuedBooks,
    getIssuedBooksForStudent,
    returnBook,
    deleteIssuedBook,
} from "../controllers/issuedBook.controllers.js";
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js'

const router = Router();

router.route('/').post(auth, roleMiddleware("Admin", "Teacher"), issueBook); // Admin & Teacher can issue books
router.route('/getAllBooks').get(auth, roleMiddleware("Admin", "Teacher"), getAllIssuedBooks); // Admin & Teacher can view all issued books
router.route("/my-books").get(auth, roleMiddleware("Student"), getIssuedBooksForStudent); // Students can view their issued books
router.route("/return/:id").put(auth, roleMiddleware("Student"), returnBook); // Students can return books
router.route("/delete/:id").delete(auth, roleMiddleware("Admin"), deleteIssuedBook); // Admin can delete issued book records

export default router;