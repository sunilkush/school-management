import express from "express";
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  getStudentDisciplineSummary,
} from "../controllers/disciplineIncident.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const DISCIPLINE_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher", "Class Teacher"];

router.post(
  "/",
  auth,
  roleMiddleware(DISCIPLINE_ROLES),
  validate({
    body: {
      studentId: { required: true, type: "objectId" },
      description: { required: true, type: "string" },
    },
  }),
  createIncident
);

router.get("/", auth, roleMiddleware(DISCIPLINE_ROLES), getIncidents);

router.get(
  "/student/:studentId/summary",
  auth,
  roleMiddleware(DISCIPLINE_ROLES),
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  getStudentDisciplineSummary
);

router.get(
  "/:id",
  auth,
  roleMiddleware(DISCIPLINE_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getIncidentById
);

router.patch(
  "/:id",
  auth,
  roleMiddleware(DISCIPLINE_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  updateIncident
);

export default router;
