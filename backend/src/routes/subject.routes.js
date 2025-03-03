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
    .post(auth, roleMiddleware(["Super Admin", "Admin"]), createSubject)
router
    .route('/subjectAll')
    .get(auth, roleMiddleware(["Super Admin", "Admin"]), getAllSubjects)
router
    .route('/subject/:id')
    .get(auth, roleMiddleware(["Super Admin", "Admin"]), getSubject)
router
    .route('/update/:id')
    .put(auth, roleMiddleware(["Super Admin", "Admin"]), updateSubject)
router
    .route('/delete/:id')
    .delete(auth, roleMiddleware(["Super Admin", "Admin"]), deleteSubject)
export default router
