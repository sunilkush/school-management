import { Router } from 'express'

import {
    registerClass,
    updateClass,
    deleteClass,
} from '../controllers/class.controllers.js'

import { auth, roleMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router
    .route('/registerClass')
    .post(auth, roleMiddleware('Admin', 'Teacher'), registerClass)

router
    .route('/updateClass/:id')
    .post(auth, roleMiddleware('Admin'), updateClass)

router
    .route('/deleteClass/:id')
    .post(auth, roleMiddleware('Admin'), deleteClass)

export default router
