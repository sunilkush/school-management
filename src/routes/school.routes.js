import { Router } from "express";
import { schoolRegister } from "../controllers/school.controllers.js"

const router = Router()

router.route("/register").post(schoolRegister)


export default router
