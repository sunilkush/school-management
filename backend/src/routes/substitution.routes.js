import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  getSubstitutionPlan,
  assignSubstitute,
  listSubstitutions,
  cancelSubstitution,
  mySubstitutions,
} from "../controllers/substitution.controllers.js";

const router = Router();

// Who arranges cover.
const COORDINATORS = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Exam Coordinator", "Subject Coordinator",
];
// Everyone above, plus teachers who need to read the day's register.
const READERS = [...COORDINATORS, "Teacher", "Class Teacher", "Sports Teacher"];

router.use(auth);

// Literal path first so it isn't captured by /:id below.
router.get("/mine", mySubstitutions);

router.get("/plan", roleMiddleware(COORDINATORS), getSubstitutionPlan);
router.get("/", roleMiddleware(READERS), listSubstitutions);
router.post("/", roleMiddleware(COORDINATORS), assignSubstitute);
router.patch("/:id/cancel", roleMiddleware(COORDINATORS), cancelSubstitution);

export default router;
