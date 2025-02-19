import { Router } from 'express'
import {
    createSubject,
    getAllSubjects,
    getSubject,
    updateSubject,
    deleteSubject,
} from '../controllers/subject.controllers.js'

import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router
    .route('/addSubject')
    .post(auth, roleMiddleware('Teacher', 'Admin'), createSubject)
router
    .route('/subjectAll')
    .get(auth, roleMiddleware('Teacher', 'Admin'), getAllSubjects)
router
    .route('/subject/:id')
    .get(auth, roleMiddleware('Teacher', 'Admin'), getSubject)
router
    .route('/update/:id')
    .put(auth, roleMiddleware('Teacher', 'Admin'), updateSubject)
router
    .route('/delete/:id')
    .delete(auth, roleMiddleware('Teacher', 'Admin'), deleteSubject)
export default router
