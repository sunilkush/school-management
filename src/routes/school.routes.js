import { Router } from "express";
import {
    schoolRegister,
    schoolUpdate,
    deactivateSchool
} from "../controllers/school.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { auth } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(upload.fields([{
    name: "logo",
    maxCount: 1
}]), schoolRegister)

router.route("/update/:id").post(auth, upload.fields([{
    name: "logo",
    maxCount: 1
}]), schoolUpdate)

router.route("/deactivate/id").post(auth, deactivateSchool)

export default router
