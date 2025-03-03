import { Router } from 'express'
import {
    schoolRegister,
    schoolUpdate,
    deactivateSchool,
} from '../controllers/school.controllers.js'
import { upload } from '../middlewares/multer.middleware.js'
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/register').post(
    auth,
    roleMiddleware(["Super Admin", "Admin"]),
    upload.fields([
        {
            name: 'logo',
            maxCount: 1,
        },
    ]),
    schoolRegister
)

router.route('/update/:id').post(
    auth,
    roleMiddleware(["Super Admin", "Admin"]),
    upload.fields([
        {
            name: 'logo',
            maxCount: 1,
        },
    ]),
    schoolUpdate
)

router
    .route('/deactivate/id')
    .post(auth, roleMiddleware(["Super Admin", "Admin"]), deactivateSchool)

export default router
