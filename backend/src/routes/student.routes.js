import { Router } from "express";

const router = Router();

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

export default router