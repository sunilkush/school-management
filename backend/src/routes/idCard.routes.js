import express from "express";
import {
  generateIdCard,
  generateBulkIdCards,
  getIdCards,
  getIdCardById,
  deactivateIdCard,
  downloadIdCardsPdf,
  getMyIdCards,
  downloadMyIdCardPdf,
  verifyIdCard,
} from "../controllers/idCard.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { ID_CARD_HOLDER_TYPES } from "../models/IDCard.model.js";

const router = express.Router();

const ID_CARD_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
const MY_ID_CARD_ROLES = ["Student", "Parent"];

const holderTypeRule = {
  required: true,
  type: "string",
  validate: (value) => ID_CARD_HOLDER_TYPES.includes(value),
  message: "body.holderType must be one of: " + ID_CARD_HOLDER_TYPES.join(", "),
};

router.post(
  "/generate",
  auth,
  roleMiddleware(ID_CARD_ROLES),
  validate({
    body: {
      holderType: holderTypeRule,
      holderId: { required: true, type: "objectId" },
    },
  }),
  generateIdCard
);

router.post(
  "/generate-bulk",
  auth,
  roleMiddleware(ID_CARD_ROLES),
  validate({ body: { holderType: holderTypeRule } }),
  generateBulkIdCards
);

router.post("/pdf", auth, roleMiddleware(ID_CARD_ROLES), downloadIdCardsPdf);

router.get("/", auth, roleMiddleware(ID_CARD_ROLES), getIdCards);

// ── Student/Parent self-service (must stay above the generic "/:id" route below) ──
router.get("/my", auth, roleMiddleware(MY_ID_CARD_ROLES), getMyIdCards);
router.get(
  "/my/:id/pdf",
  auth,
  roleMiddleware(MY_ID_CARD_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  downloadMyIdCardPdf
);

// ── Public verification (no auth — exempted via PUBLIC_API_ROUTE_PATTERNS in auth.middleware.js) ──
router.get("/verify/:cardNumber", verifyIdCard);

router.patch(
  "/:id/deactivate",
  auth,
  roleMiddleware(ID_CARD_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  deactivateIdCard
);

router.get(
  "/:id",
  auth,
  roleMiddleware(ID_CARD_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getIdCardById
);

export default router;
