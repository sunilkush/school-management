import { Router } from 'express';
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';
import {
    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword, getUser
} from '../controllers/user.controllers.js';

import { upload } from '../middlewares/multer.middleware.js';

const router = Router()

router.route('/adminRegister').post(
    upload.fields([{
        name: "avatar",
        maxCount: 1
    }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

// secure route
router.route('/update/:id').post(auth, updateUser)
router.route('/changePassword').post(auth, changeCurrentPassword);
router.route("/getuser").get(auth, getUser);




export default router
