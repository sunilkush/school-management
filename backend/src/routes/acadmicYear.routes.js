import { Router } from "express";
import {
   deleteAcademicYear,
    updateAcademicYear,
    getAcademicYearById,
    getAllAcademicYears,
    createAcademicYear,
    getActiveAcademicYear
} from "../controllers/acadmicYear.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Role-Based Access Control
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const ALL_USERS = ["Super Admin", "School Admin", "Teacher", "Student", "Parent"];
//

// Create
router.post('/create', auth, roleMiddleware(ADMIN_ROLE), createAcademicYear);

// Get all
router.get('/allYear', auth, roleMiddleware(ADMIN_ROLE), getAllAcademicYears);

// Get one by ID
router.get('/:id', auth, roleMiddleware(ADMIN_ROLE), getAcademicYearById);

// Update
router.put('/:id', auth, roleMiddleware(ADMIN_ROLE), updateAcademicYear);

// Delete
router.delete('/:id', auth, roleMiddleware(ADMIN_ROLE), deleteAcademicYear);

// Get Active Academic Year
router.get('/active', auth, roleMiddleware(ALL_USERS), getActiveAcademicYear);

export default router;
