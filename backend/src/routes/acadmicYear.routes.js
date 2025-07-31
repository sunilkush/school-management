import { Router } from "express";
import {
  createAcademicYear,
  getAllAcademicYears,
  getActiveAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} from '../controllers/acadmicYear.controllers.js';
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Role Groups
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const ALL_USERS = ["Super Admin", "School Admin", "Teacher", "Student", "Parent"];

// ✅ Routes

// Create academic year
router.post('/create', auth, roleMiddleware(ALL_USERS), createAcademicYear);

// ⚠️ Move this above '/:schoolId' to prevent conflict
// Get active academic year for a school
router.get('/active/:schoolId', auth, roleMiddleware(ALL_USERS), getActiveAcademicYear);

// Get all academic years for a school
router.get('/:schoolId', auth, roleMiddleware(ALL_USERS), getAllAcademicYears);

// Update academic year
router.put('/:id', auth, roleMiddleware(ALL_USERS), updateAcademicYear);

// Delete academic year
router.delete('/:id', auth, roleMiddleware(ALL_USERS), deleteAcademicYear);

export default router;
