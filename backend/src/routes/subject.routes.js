import { Router } from 'express'
import {
    createSubject,
    getAllSubjects,
    getSubject,
    updateSubject,
    deleteSubject,
} from '../controllers/subject.controllers.js'

import { auth, roleMiddleware } from '../middlewares/auth.middleware.js'
const router = Router()
router.route('/addSubject').post(auth, createSubject)
router.route("/subjectAll").get(auth, getAllSubjects)
router.route("/subject/:id").get(auth, getSubject)
router.route("/update/:id").put(auth, updateSubject)
router.route('/delete/:id').delete(auth, deleteSubject)
export default router
