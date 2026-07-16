import express from "express";
import {
  generateCertificate,
  getCertificates,
  getCertificateById,
  revokeCertificate,
  downloadCertificatePdf,
  getMyCertificates,
  downloadMyCertificatePdf,
  verifyCertificate,
} from "../controllers/certificate.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { CERTIFICATE_TYPES } from "../models/Certificate.model.js";

const router = express.Router();

const CERTIFICATE_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
const MY_CERTIFICATE_ROLES = ["Student", "Parent"];

router.post(
  "/generate",
  auth,
  roleMiddleware(CERTIFICATE_ROLES),
  validate({
    body: {
      studentId: { required: true, type: "objectId" },
      certificateType: {
        required: true,
        type: "string",
        validate: (value) => CERTIFICATE_TYPES.includes(value),
        message: "body.certificateType must be one of: " + CERTIFICATE_TYPES.join(", "),
      },
    },
  }),
  generateCertificate
);

router.get("/", auth, roleMiddleware(CERTIFICATE_ROLES), getCertificates);

// ── Student/Parent self-service (must stay above the generic "/:id" route below) ──
router.get("/my", auth, roleMiddleware(MY_CERTIFICATE_ROLES), getMyCertificates);
router.get(
  "/my/:id/pdf",
  auth,
  roleMiddleware(MY_CERTIFICATE_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  downloadMyCertificatePdf
);

// ── Public verification (no auth — exempted via PUBLIC_API_ROUTE_PATTERNS in auth.middleware.js) ──
router.get("/verify/:certificateNumber", verifyCertificate);

router.get(
  "/:id/pdf",
  auth,
  roleMiddleware(CERTIFICATE_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  downloadCertificatePdf
);

router.patch(
  "/:id/revoke",
  auth,
  roleMiddleware(CERTIFICATE_ROLES),
  validate({
    params: { id: { required: true, type: "objectId" } },
    body: { revokeReason: { required: true, type: "string" } },
  }),
  revokeCertificate
);

router.get(
  "/:id",
  auth,
  roleMiddleware(CERTIFICATE_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getCertificateById
);

export default router;
