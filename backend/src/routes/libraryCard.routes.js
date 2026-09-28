import express from "express";
import {
  getLibraryCards,
  getCardCandidates,
  issueLibraryCard,
  revokeLibraryCard,
} from "../controllers/libraryCard.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { LIBRARY_CARD_HOLDER_TYPES } from "../models/LibraryCard.model.js";

const router = express.Router();

// Issuing and revoking is the library's job; the Principal's "Library" menu and the Vice Principal
// can look at the cards but not change them.
const CARD_MANAGERS = ["School Admin", "Librarian"];
const CARD_VIEWERS = [...CARD_MANAGERS, "Principal", "Vice Principal"];

router.get("/", auth, roleMiddleware(CARD_VIEWERS), getLibraryCards);
router.get("/candidates", auth, roleMiddleware(CARD_MANAGERS), getCardCandidates);

router.post(
  "/",
  auth,
  roleMiddleware(CARD_MANAGERS),
  validate({
    body: {
      holderType: {
        required: true,
        type: "string",
        validate: (value) => LIBRARY_CARD_HOLDER_TYPES.includes(value),
        message: "body.holderType must be one of: " + LIBRARY_CARD_HOLDER_TYPES.join(", "),
      },
      holderId: { required: true, type: "objectId" },
      expiryDate: { required: true, type: "string" },
    },
  }),
  issueLibraryCard
);

router.patch(
  "/:id/revoke",
  auth,
  roleMiddleware(CARD_MANAGERS),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  revokeLibraryCard
);

export default router;
