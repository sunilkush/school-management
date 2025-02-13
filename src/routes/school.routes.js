import { Router } from "express";
import { schoolRegister } from "../controllers/school.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(upload.fields([{
    name: "logo",
    maxCount: 1
}]), schoolRegister)


export default router
