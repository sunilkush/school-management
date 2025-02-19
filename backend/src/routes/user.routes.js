import { Router } from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import {
    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword,
} from '../controllers/user.controllers.js'
import { upload } from '../middlewares/multer.middleware.js'
const router = Router()

router.route('/register').post(
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
router.route('/changePassword').post(auth, changeCurrentPassword)

export default router
