import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  generateForClass,
  listReportCards,
  getReportCard,
  updateReportCard,
  publishReportCards,
  myReportCards,
  childReportCards,
} from "../controllers/reportCard.controllers.js";

const router = Router();

// Who designs a term and decides when cards go out.
const EXAM_ADMIN = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Exam Coordinator"];
// Teachers additionally read cards and fill in the co-scholastic grades and remarks.
const CARD_STAFF = [...EXAM_ADMIN, "Teacher", "Class Teacher", "Subject Coordinator"];

router.use(auth);

/* Self-service first — these are literal paths and must not be captured by /:id below. */
router.get("/mine", roleMiddleware(["Student"]), myReportCards);
router.get("/child/:studentId", roleMiddleware(["Parent"]), childReportCards);

/* Templates */
router.get("/templates", roleMiddleware(CARD_STAFF), listTemplates);
router.post("/templates", roleMiddleware(EXAM_ADMIN), createTemplate);
router.get("/templates/:id", roleMiddleware(CARD_STAFF), getTemplate);
router.put("/templates/:id", roleMiddleware(EXAM_ADMIN), updateTemplate);
router.delete("/templates/:id", roleMiddleware(EXAM_ADMIN), deleteTemplate);

/* Generation & publishing */
router.post("/generate", roleMiddleware(EXAM_ADMIN), generateForClass);
router.post("/publish", roleMiddleware(EXAM_ADMIN), publishReportCards);

/* Cards */
router.get("/", roleMiddleware(CARD_STAFF), listReportCards);
router.get("/:id", roleMiddleware(CARD_STAFF), getReportCard);
router.patch("/:id", roleMiddleware(CARD_STAFF), updateReportCard);

export default router;
