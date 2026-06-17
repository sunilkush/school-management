import { Router } from "express";
import {
  createStudyMaterial,
  getStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
} from "../controllers/studyMaterial.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

const TEACHER_AND_ABOVE = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher"];
const ALL_SCHOOL_USERS  = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher", "Student"];

router.get("/",    auth, roleMiddleware(ALL_SCHOOL_USERS),  getStudyMaterials);
router.post("/",   auth, roleMiddleware(TEACHER_AND_ABOVE), upload.single("file"), createStudyMaterial);
router.get("/:id", auth, roleMiddleware(ALL_SCHOOL_USERS),  getStudyMaterialById);
router.put("/:id", auth, roleMiddleware(TEACHER_AND_ABOVE), upload.single("file"), updateStudyMaterial);
router.delete("/:id", auth, roleMiddleware(TEACHER_AND_ABOVE), deleteStudyMaterial);

export default router;
