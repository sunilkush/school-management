import { Router } from "express";

import {
    getAllStudents,
    addStudent
} from "../controllers/student.controller.js";

import { auth } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/allStudents").get(auth, getAllStudents)
router.route("/addStudent").post(auth, addStudent)

export default router