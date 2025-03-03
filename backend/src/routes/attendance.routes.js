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
        roleMiddleware(["Super Admin", "Admin", "Teacher"]),
        getAttendanceByClass
    )
router
    .route('/Update/:id')
    .put(
        auth,
        roleMiddleware(["Super Admin", "Admin", "Teacher"]),
        updateAttendanceRecord
    )
router
    .route('/Deleate/:id')
    .put(
        auth,
        roleMiddleware(["Super Admin", "Admin", "Teacher"]),
        deleteAttendanceRecord
    )

export default router
