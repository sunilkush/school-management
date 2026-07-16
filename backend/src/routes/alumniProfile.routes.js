import express from "express";
import {
  markAsAlumni,
  getAlumni,
  getAlumniById,
  updateAlumniProfile,
} from "../controllers/alumniProfile.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const ALUMNI_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal"];

router.post(
  "/mark",
  auth,
  roleMiddleware(ALUMNI_ROLES),
  validate({
    body: {
      studentId: { required: true, type: "objectId" },
      graduationYear: { required: true, type: "positiveInt" },
    },
  }),
  markAsAlumni
);

router.get("/", auth, roleMiddleware(ALUMNI_ROLES), getAlumni);

router.get(
  "/:id",
  auth,
  roleMiddleware(ALUMNI_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getAlumniById
);

router.patch(
  "/:id",
  auth,
  roleMiddleware(ALUMNI_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  updateAlumniProfile
);

export default router;
