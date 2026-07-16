import express from "express";
import {
  getHealthProfile,
  upsertHealthProfile,
  createHealthVisit,
  getHealthVisits,
  getHealthVisitById,
  updateHealthVisit,
} from "../controllers/healthRecord.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const HEALTH_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Medical Officer"];

router.get(
  "/profile/:studentId",
  auth,
  roleMiddleware(HEALTH_ROLES),
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  getHealthProfile
);

router.put(
  "/profile/:studentId",
  auth,
  roleMiddleware(HEALTH_ROLES),
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  upsertHealthProfile
);

router.post(
  "/visits",
  auth,
  roleMiddleware(HEALTH_ROLES),
  validate({
    body: {
      studentId: { required: true, type: "objectId" },
      symptoms: { required: true, type: "string" },
    },
  }),
  createHealthVisit
);

router.get("/visits", auth, roleMiddleware(HEALTH_ROLES), getHealthVisits);

router.get(
  "/visits/:id",
  auth,
  roleMiddleware(HEALTH_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getHealthVisitById
);

router.patch(
  "/visits/:id",
  auth,
  roleMiddleware(HEALTH_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  updateHealthVisit
);

export default router;
