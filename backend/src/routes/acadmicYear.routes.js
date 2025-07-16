import { Router } from "express";
import {
    deleteAcademicYear,
    updateAcademicYear,
    getAcademicYearById,
    getAllAcademicYears,
    createAcademicYear
} from "../controllers/acadmicYear.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Role-Based Access Control
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const ALL_USERS = ["Super Admin", "School Admin", "Teacher", "Student", "Parent"];
//

// Create
router.post('/create', auth, roleMiddleware(ALL_USERS), createAcademicYear);

// Get all
router.get('/allYear', auth, roleMiddleware(ALL_USERS), getAllAcademicYears);

// Get one by ID
router.get('/:id', auth, roleMiddleware(ALL_USERS), getAcademicYearById);

// Update
router.put('/:id', auth, roleMiddleware(ALL_USERS), updateAcademicYear);

// Delete
router.delete('/:id', auth, roleMiddleware(ALL_USERS), deleteAcademicYear);

export default router;
