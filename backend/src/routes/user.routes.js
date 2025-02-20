import { Router } from 'express';
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';
import {
    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword,getUser
} from '../controllers/user.controllers.js';

import { upload } from '../middlewares/multer.middleware.js';

const router = Router()

router.route('/adminRegister').post(
    upload.fields([
        {
            name: '',
            maxCount: 1,
        },
    ]),
    registerUser
)

router.route('/login').post(loginUser)

// secure route
router.route('/update/:id').post(auth, updateUser)
router.route('/changePassword').post(auth, changeCurrentPassword);
router.route("/getuser").get(auth,getUser);

router.route('/studentRegister').post(
    auth,
    roleMiddleware('Admin'),
    upload.fields([
        {
            name: '',
            maxCount: 1,
        },
    ]),
    registerUser
)
router.route('/teacherRegister').post(
    auth,
    roleMiddleware('Admin'),
    upload.fields([
        {
            name: '',
            maxCount: 1,
        },
    ]),
    registerUser
)

export default router
