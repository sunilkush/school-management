import express from "express";
import {
  createSchoolClass,
  getAllSchoolClasses,
  getSchoolClassById,
  updateSchoolClass,
  deleteSchoolClass,
  getSchoolClassSectionSubjects
} from "../controllers/schoolClass.controllers.js";

import { auth,roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const ADMIN_ONLY = ["Super Admin", "School Admin"];
// 🔹 Create
router.post("/",auth, roleMiddleware(ADMIN_ONLY), createSchoolClass);

// 🔹 Get All (with query ?schoolId=&academicYearId=)
router.get("/",auth, roleMiddleware(ADMIN_ONLY), getAllSchoolClasses);
// Class full data
router.get("/class-detailes",auth,roleMiddleware(ADMIN_ONLY), getSchoolClassSectionSubjects);
// 🔹 Get Single
router.get("/:id",auth, roleMiddleware(ADMIN_ONLY), getSchoolClassById);

// 🔹 Update
router.put("/:id",auth, roleMiddleware(ADMIN_ONLY), updateSchoolClass);

// 🔹 Delete
router.delete("/:id",auth, roleMiddleware(ADMIN_ONLY), deleteSchoolClass);


export default router;