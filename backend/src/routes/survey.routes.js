import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  closeSurvey,
  createSurvey,
  deleteSurvey,
  getPending,
  getResponses,
  getResults,
  listSurveys,
  myResponse,
  mySurveys,
  openSurvey,
  submitResponse,
  updateSurvey,
} from "../controllers/survey.controllers.js";

const router = Router();

const RUNNERS = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
const SURVEY_STAFF = [...RUNNERS, "Receptionist", "Counselor"];
// Anybody can be asked for their opinion.
const EVERYONE = [
  ...SURVEY_STAFF,
  "Teacher", "Class Teacher", "Sports Teacher", "Lab Technician", "Medical Officer",
  "Subject Coordinator", "Exam Coordinator", "Accountant", "Librarian", "Hostel Warden",
  "Transport Manager", "IT Support", "Security", "Staff", "Support Staff", "Driver",
  "Student", "Parent",
];

router.use(auth);

/* Literal paths before /:id so they are not captured by it. */
router.get("/mine", roleMiddleware(EVERYONE), mySurveys);

router.get("/", roleMiddleware(SURVEY_STAFF), listSurveys);
router.post("/", roleMiddleware(SURVEY_STAFF), createSurvey);

router.patch("/:id", roleMiddleware(SURVEY_STAFF), updateSurvey);
router.delete("/:id", roleMiddleware(SURVEY_STAFF), deleteSurvey);
router.post("/:id/open", roleMiddleware(RUNNERS), openSurvey);
router.post("/:id/close", roleMiddleware(RUNNERS), closeSurvey);

router.get("/:id/my-response", roleMiddleware(EVERYONE), myResponse);
router.post("/:id/respond", roleMiddleware(EVERYONE), submitResponse);

router.get("/:id/results", roleMiddleware(SURVEY_STAFF), getResults);
router.get("/:id/pending", roleMiddleware(SURVEY_STAFF), getPending);
// Refused on an anonymous survey inside the controller, not here — the rule belongs with the data.
router.get("/:id/responses", roleMiddleware(RUNNERS), getResponses);

export default router;
