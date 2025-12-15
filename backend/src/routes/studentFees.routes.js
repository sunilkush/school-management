import express from "express";
import {
  assignFeesToStudents,
  getMyFees,
  payStudentFee,
  studentFeeSummary
} from "../controllers/studentFees.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const ADMIN_ROLE = ["Super Admin", "School Admin"];

const ALL_USERS = [ "Student", "Parent"];
/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS
   Role: school_admin
=====================================================*/
router.post(
  "/assign",
  auth,
  roleMiddleware("School Admin"),
  assignFeesToStudents
);

/* =====================================================
   ✅ STUDENT/PARENT FEES LIST
   Role: student, parent
=====================================================*/
router.get(
  "/my",
  auth,
  roleMiddleware(ALL_USERS),
  getMyFees
);

/* =====================================================
   ✅ PAY FEES
   Role: student
=====================================================*/
router.post(
  "/pay/:id",
  auth,
  roleMiddleware(ALL_USERS),
  payStudentFee
);

/* =====================================================
   ✅ ADMIN FEES SUMMARY
   Role: school_admin
=====================================================*/
router.get(
  "/summary",
  auth,
  roleMiddleware(ADMIN_ROLE),
  studentFeeSummary
);

export default router;
