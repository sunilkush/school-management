import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  listAdmissionSchools,
  getSchoolAdmissionInfo,
  submitApplication,
  trackApplication,
  uploadApplicationDocuments,
} from "../controllers/publicAdmission.controllers.js";
import { uploadPublicAdmissionDocs } from "../middlewares/multer.middleware.js";

/**
 * Unauthenticated admission-portal routes.
 *
 * NOTE: `allowPublic` does NOT work for these. registerRoutes mounts
 * `enforceApiAuthByDefault` on /api/v1 *before* any route file's own middleware runs, so a
 * per-route flag is set too late to be seen. Every path below must therefore also be listed
 * in PUBLIC_API_ROUTE_PATTERNS in middlewares/auth.middleware.js — if a path here changes,
 * change it there too or the route starts 401-ing.
 *
 * Paths are shaped so no two collide (`/schools/:id` vs `/documents/:applicationNumber`)
 * and each maps to exactly one anchored pattern.
 */

const router = Router();

/** These limits are far tighter than the app-wide one (800/15min), because every route here is
 *  reachable without a session. That makes them trip inside the test suite, which drives many
 *  applications from the single loopback IP — express-rate-limit counters are process-global and
 *  survive `clearTestDb`, so the 11th request in a file would 429 regardless of what it is
 *  testing. Skipping under NODE_ENV=test (set by tests/setup/env.js) keeps production behaviour
 *  untouched; the trade-off is that the limits themselves are not exercised by the suite. */
const publicLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { success: false, message, data: null },
  });

const readLimiter = publicLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many requests. Please try again later.",
});

const applyLimiter = publicLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many applications from this device. Please try again later.",
});

const uploadLimiter = publicLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many uploads. Please try again later.",
});

router.get("/schools", readLimiter, listAdmissionSchools);
router.get("/schools/:schoolId", readLimiter, getSchoolAdmissionInfo);
router.get("/track", readLimiter, trackApplication);
router.post("/apply", applyLimiter, submitApplication);
router.post(
  "/documents/:applicationNumber",
  uploadLimiter,
  uploadPublicAdmissionDocs.array("documents", 5),
  uploadApplicationDocuments
);

export default router;
