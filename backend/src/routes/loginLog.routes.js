import { Router } from 'express';
import { createLoginLog, getLoginLogsByUser, getLoginLogsBySchool, getLoginLogsByAcademicYear ,createLoginLog,
  getLoginLogs,
  setLogoutTime,
  getLoginStats, } from '../controllers/loginLog.controllers.js';
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';
const router = Router();
// Role-Based Access Control
const ADMIN_ROLE = ['Super Admin', 'School Admin'];
const TEACHER_ROLE = ['Super Admin', 'School Admin', 'Teacher'];
const ALL_USERS = ['Super Admin', 'School Admin', 'Teacher', 'Student', 'Parent'];
// Create Login Log
router.post('/', auth, roleMiddleware(ALL_USERS), createLoginLog);
// Get Login Logs by User
router.get('/user/:userId', auth, roleMiddleware(ALL_USERS), getLoginLogsByUser);
// Get Login Logs by School
router.get('/school/:schoolId', auth, roleMiddleware(ADMIN_ROLE), getLoginLogsBySchool);
// Get Login Logs by Academic Year
router.get('/academic-year/:academicYearId', auth, roleMiddleware(ADMIN_ROLE), getLoginLogsByAcademicYear);

router.post('/', createLoginLog);
router.get('/', getLoginLogs);
router.put('/:id/logout', setLogoutTime);
router.get('/stats', getLoginStats);
export default router;
// This code defines routes for managing login logs, including creating logs and retrieving them by user,