import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createScheme,
  decideAward,
  deleteScheme,
  getGiveawayReport,
  getMismatches,
  getStudentConcession,
  listAwards,
  listSchemes,
  recordAppliedAmounts,
  requestAward,
  revokeAward,
  syncConcessions,
  updateScheme,
} from "../controllers/scholarship.controllers.js";

const router = Router();

// Who decides the school will take less money. Deliberately narrow — a concession is a permanent
// hole in the year's income, not a routine edit.
const APPROVERS = ["Super Admin", "School Admin", "Principal"];
// The accounts desk sets the schemes up and raises requests, but does not approve its own.
const SCHEME_MANAGE = [...APPROVERS, "Accountant"];
// Reception and leadership can see who holds what without being able to grant it.
const READERS = [...SCHEME_MANAGE, "Vice Principal", "Receptionist"];

router.use(auth);

/* Reports and actions before /:id so they are not captured by it. */
router.get("/report", roleMiddleware(READERS), getGiveawayReport);
router.get("/mismatches", roleMiddleware(SCHEME_MANAGE), getMismatches);
router.post("/sync", roleMiddleware(SCHEME_MANAGE), syncConcessions);
router.post("/record-amounts", roleMiddleware(SCHEME_MANAGE), recordAppliedAmounts);

router.get("/schemes", roleMiddleware(READERS), listSchemes);
router.post("/schemes", roleMiddleware(SCHEME_MANAGE), createScheme);
router.patch("/schemes/:id", roleMiddleware(SCHEME_MANAGE), updateScheme);
router.delete("/schemes/:id", roleMiddleware(APPROVERS), deleteScheme);

router.get("/awards", roleMiddleware(READERS), listAwards);
router.post("/awards", roleMiddleware(SCHEME_MANAGE), requestAward);
// Approving is the one action kept to the people who carry the budget.
router.patch("/awards/:id/decide", roleMiddleware(APPROVERS), decideAward);
router.patch("/awards/:id/revoke", roleMiddleware(APPROVERS), revokeAward);

router.get("/students/:studentId", roleMiddleware(READERS), getStudentConcession);

export default router;
