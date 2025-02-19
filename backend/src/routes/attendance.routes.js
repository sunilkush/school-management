import { Router } from 'express'
import {
    markAttendance,
    getAttendanceByStudent,
    getAttendanceByClass,
    updateAttendanceRecord,
    deleteAttendanceRecord,
} from '../controllers/attendance.controllers.js'
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js'
const router = Router()

router
    .route('/')
    .post(auth, roleMiddleware(['teacher', 'admin']), markAttendance)
router
    .route('/Student/:id')
    .get(auth, roleMiddleware(['student', 'admin']), getAttendanceByStudent)
router
    .route('/Class/:id')
    .get(
        auth,
        roleMiddleware(['teacher', 'admin', 'super admin']),
        getAttendanceByClass
    )
router
    .route('/Update/:id')
    .put(
        auth,
        roleMiddleware(['teacher', 'admin', 'super admin']),
        updateAttendanceRecord
    )
router
    .route('/Deleate/:id')
    .put(
        auth,
        roleMiddleware(['teacher', 'admin', 'super admin']),
        deleteAttendanceRecord
    )

export default router
