import {Router} from 'express';
import {
    markAttendance,
    getAttendanceByStudent,
    getAttendanceByClass,
    updateAttendanceRecord,
    deleteAttendanceRecord
} from "../controllers/attendance.controllers.js";
import {auth,roleMiddleware} from '../middlewares/auth.middleware.js'
const router = Router()


router.route('/attendance').post(auth,roleMiddleware(['teacher']),markAttendance)
router.route('/attendanceStudent/:id').post(auth,roleMiddleware(['student',]),getAttendanceByStudent)
router.route('/attendanceClass/:id').post(auth,roleMiddleware(['teacher','admin','super admin']),getAttendanceByClass)
router.route('/attendanceUpdate/:id').post(auth,roleMiddleware(['teacher','admin','super admin']),updateAttendanceRecord)
router.route('/attendanceDeleate/:id').post(auth,roleMiddleware(['teacher','admin','super admin']),deleteAttendanceRecord)

export default router