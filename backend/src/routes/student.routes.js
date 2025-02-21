import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser } from "../controllers/user.controllers.js";
const router = Router();

router.route('/register').post(
    auth,
    roleMiddleware("Super Admin"),
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1,
        },
    ]),
    registerUser
)

router.route('/update/:id').patch()

export default router