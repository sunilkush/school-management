import { Router } from "express"
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
    registerUser,
    updateUser
} from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js"
const router = Router()

router.route('/register').post(upload.fields([{
    name: "",
    maxCount: 1
}]), registerUser)
router.route('/update/:id').post(auth, updateUser)

export default router