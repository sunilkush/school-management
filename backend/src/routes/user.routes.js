import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import {
    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword,
    getCurrentUser,
    logoutUser
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
router.route('/update').patch(auth, updateUser)
router.route('/changePassword').patch(auth, changeCurrentPassword);
router.route("/getCurrentUser").get(auth, getCurrentUser);
router.route("/logoutUser").get(auth, logoutUser);

export default router
