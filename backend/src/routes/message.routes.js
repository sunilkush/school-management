import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  archiveMessage,
  createMessage,
  deleteMessageForMe,
  getMessageThread,
  listMessageRecipients,
  listMessages,
  markMessageRead,
} from "../controllers/message.controllers.js";

const router = Router();

router.get("/recipients", auth, listMessageRecipients);
router.get("/", auth, listMessages);
router.get("/:id/thread", auth, getMessageThread);
router.post("/", auth, createMessage);
router.patch("/:id/read", auth, markMessageRead);
router.patch("/:id/archive", auth, archiveMessage);
router.delete("/:id", auth, deleteMessageForMe);

export default router;
