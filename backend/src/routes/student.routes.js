import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

import { registerStudent, getStudents } from "../controllers/student.controllers.js";
const router = Router();

router.route('/register').post(
    auth,
    roleMiddleware(["Super Admin", "Admin"]),
    registerStudent
)
router.route('/getStudents').get(
    auth,
    roleMiddleware(["Super Admin", "Admin", "Student"]),
    getStudents
)


export default router