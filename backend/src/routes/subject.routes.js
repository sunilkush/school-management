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
    .post(auth, roleMiddleware('teacher', 'Admin'), createSubject)
router
    .route('/subjectAll')
    .get(auth, roleMiddleware('teacher', 'Admin'), getAllSubjects)
router
    .route('/subject/:id')
    .get(auth, roleMiddleware('teacher', 'Admin'), getSubject)
router
    .route('/update/:id')
    .put(auth, roleMiddleware('teacher', 'Admin'), updateSubject)
router
    .route('/delete/:id')
    .delete(auth, roleMiddleware('teacher', 'Admin'), deleteSubject)
export default router
