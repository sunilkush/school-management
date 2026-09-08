import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  acknowledgeCircular,
  archiveCircular,
  createCircular,
  deleteCircular,
  getAcknowledgements,
  getAcknowledgementStatus,
  getPending,
  listCirculars,
  myCirculars,
  publishCircular,
  readCircular,
  updateCircular,
} from "../controllers/circular.controllers.js";

const router = Router();

// Who issues a circular in the school's name. Narrow on purpose — a circular carries the school's
// authority, and one sent in error has to be superseded rather than deleted.
const ISSUERS = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
// Reception drafts and tracks who has replied without being able to publish.
const CIRCULAR_STAFF = [...ISSUERS, "Receptionist"];
// Everyone who might be addressed by one.
const EVERYONE = [
  ...CIRCULAR_STAFF,
  "Teacher", "Class Teacher", "Sports Teacher", "Lab Technician", "Medical Officer",
  "Subject Coordinator", "Exam Coordinator", "Accountant", "Librarian", "Hostel Warden",
  "Transport Manager", "IT Support", "Counselor", "Security", "Staff", "Support Staff",
  "Driver", "Student", "Parent",
];

router.use(auth);

/* Literal paths before /:id so they are not captured by it. */
router.get("/mine", roleMiddleware(EVERYONE), myCirculars);

router.get("/", roleMiddleware(CIRCULAR_STAFF), listCirculars);
router.post("/", roleMiddleware(CIRCULAR_STAFF), createCircular);

router.get("/:id", roleMiddleware(EVERYONE), readCircular);
router.patch("/:id", roleMiddleware(CIRCULAR_STAFF), updateCircular);
router.delete("/:id", roleMiddleware(CIRCULAR_STAFF), deleteCircular);

router.post("/:id/publish", roleMiddleware(ISSUERS), publishCircular);
router.post("/:id/archive", roleMiddleware(ISSUERS), archiveCircular);
router.post("/:id/acknowledge", roleMiddleware(EVERYONE), acknowledgeCircular);

router.get("/:id/status", roleMiddleware(CIRCULAR_STAFF), getAcknowledgementStatus);
router.get("/:id/pending", roleMiddleware(CIRCULAR_STAFF), getPending);
router.get("/:id/acknowledgements", roleMiddleware(CIRCULAR_STAFF), getAcknowledgements);

export default router;
