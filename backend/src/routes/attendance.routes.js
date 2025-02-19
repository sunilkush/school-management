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
    .post(auth, markAttendance)
router
    .route('/Student/:id')
    .get(auth, getAttendanceByStudent)
router
    .route('/Class/:id')
    .get(
        auth,
        roleMiddleware('Teacher', 'Admin', 'Super Admin'),
        getAttendanceByClass
    )
router
    .route('/Update/:id')
    .put(
        auth,
        roleMiddleware('Teacher', 'Admin', 'Super Admin'),
        updateAttendanceRecord
    )
router
    .route('/Deleate/:id')
    .put(
        auth,
        roleMiddleware('Teacher', 'Admin', 'Super Admin'),
        deleteAttendanceRecord
    )

export default router
