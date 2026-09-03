import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  bulkUpdateStudentCompliance,
  getExport,
  getReadiness,
  getRte,
  getSchoolCompliance,
  listStudentCompliance,
  updateSchoolCompliance,
  updateStudentCompliance,
} from "../controllers/compliance.controllers.js";

const router = Router();

// The office that actually files the return.
const COMPLIANCE_MANAGE = ["Super Admin", "School Admin", "Receptionist"];
// Leadership reads the position without being able to change a child's category or RTE status.
const COMPLIANCE_READ = [...COMPLIANCE_MANAGE, "Principal", "Vice Principal"];

router.use(auth);

/* Literal paths first, so they are not captured by /students/:id. */
router.get("/school", roleMiddleware(COMPLIANCE_READ), getSchoolCompliance);
router.put("/school", roleMiddleware(COMPLIANCE_MANAGE), updateSchoolCompliance);

router.get("/readiness", roleMiddleware(COMPLIANCE_READ), getReadiness);
router.get("/rte", roleMiddleware(COMPLIANCE_READ), getRte);
router.get("/export", roleMiddleware(COMPLIANCE_READ), getExport);

router.get("/students", roleMiddleware(COMPLIANCE_READ), listStudentCompliance);
router.patch("/students/bulk", roleMiddleware(COMPLIANCE_MANAGE), bulkUpdateStudentCompliance);
router.patch("/students/:id", roleMiddleware(COMPLIANCE_MANAGE), updateStudentCompliance);

export default router;
