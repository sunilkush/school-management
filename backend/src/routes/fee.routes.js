import express from "express";
import {
  createFees,
  getAllFees,
  updateFee,
  deleteFee,
} from "../controllers/fee.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* =====================================================
   ✅ CREATE FEE
   Role: super_admin, school_admin
=====================================================*/
router.post(
  "/createFees",
  auth,
  roleMiddleware("Super Admin", "School Admin","Accountant"),
  createFees
);

/* =====================================================
   ✅ GET ALL FEES (School + Academic Year)
   Role: super_admin, school_admin
=====================================================*/
router.get(
  "/allFees",
  auth,
  roleMiddleware("Super Admin", "School Admin","Accountant"),
  getAllFees
);

/* =====================================================
   ✅ UPDATE FEE
   Role: school_admin
=====================================================*/
router.put(
  "/:id",
  auth,
  roleMiddleware("School Admin","Accountant"),
  updateFee
);

/* =====================================================
   ✅ DELETE FEE
   Role: school_admin
=====================================================*/
router.delete(
  "/:id",
  auth,
  roleMiddleware("School Admin","Accountant"),
  deleteFee
);

export default router;
