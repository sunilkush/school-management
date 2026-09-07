import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createApplication,
  createCycle,
  createPosting,
  deletePosting,
  getMyReview,
  getPipeline,
  getReview,
  listApplications,
  listCycles,
  listPostings,
  listReviews,
  moveApplicationStage,
  reopenApplication,
  startCycleReviews,
  submitReview,
  submitSelfAssessment,
  updateCycle,
  updatePosting,
} from "../controllers/hr.controllers.js";

const router = Router();

// Hiring and appraisals are run out of the head's office at a school this size — there is no
// separate HR department role in this system, and inventing one would leave it unassigned.
const HR_MANAGE = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
// Coordinators sit on interview panels and appraise their own teams, so they read but do not
// create postings or open cycles.
const HR_READ = [...HR_MANAGE, "Subject Coordinator", "Exam Coordinator"];
// Anyone with a staff record can have an appraisal, so everyone employed can reach their own.
const STAFF = [
  ...HR_READ,
  "Teacher", "Class Teacher", "Sports Teacher", "Lab Technician", "Medical Officer",
  "Accountant", "Librarian", "Hostel Warden", "Transport Manager", "Receptionist",
  "IT Support", "Counselor", "Security", "Staff", "Support Staff", "Driver",
];

router.use(auth);

/* ── Recruitment ─────────────────────────────────────────────────
   Literal paths before /:id so they are not captured by it. */
router.get("/postings/pipeline", roleMiddleware(HR_READ), getPipeline);
router.get("/postings", roleMiddleware(HR_READ), listPostings);
router.post("/postings", roleMiddleware(HR_MANAGE), createPosting);
router.patch("/postings/:id", roleMiddleware(HR_MANAGE), updatePosting);
router.delete("/postings/:id", roleMiddleware(HR_MANAGE), deletePosting);

router.get("/applications", roleMiddleware(HR_READ), listApplications);
router.post("/applications", roleMiddleware(HR_READ), createApplication);
router.patch("/applications/:id/stage", roleMiddleware(HR_READ), moveApplicationStage);
router.patch("/applications/:id/reopen", roleMiddleware(HR_MANAGE), reopenApplication);

/* ── Appraisals ──────────────────────────────────────────────── */
router.get("/appraisal/cycles", roleMiddleware(HR_READ), listCycles);
router.post("/appraisal/cycles", roleMiddleware(HR_MANAGE), createCycle);
router.patch("/appraisal/cycles/:id", roleMiddleware(HR_MANAGE), updateCycle);
router.post("/appraisal/cycles/:id/start", roleMiddleware(HR_MANAGE), startCycleReviews);

// Every member of staff can open their own, and only their own — the controller checks the id.
router.get("/appraisal/reviews/mine", roleMiddleware(STAFF), getMyReview);
router.get("/appraisal/reviews", roleMiddleware(HR_READ), listReviews);
router.get("/appraisal/reviews/:id", roleMiddleware(HR_READ), getReview);
router.patch("/appraisal/reviews/:id/self", roleMiddleware(STAFF), submitSelfAssessment);
router.patch("/appraisal/reviews/:id/review", roleMiddleware(HR_READ), submitReview);

export default router;
