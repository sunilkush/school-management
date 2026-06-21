import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createSession, getSessions, updateSession, deleteSession, getSessionStats,
} from "../controllers/counselingSession.controllers.js";

const router = Router();
router.use(auth);

const ALLOWED = ["School Admin", "Counselor", "Super Admin", "Principal"];

router.get   ("/stats", roleMiddleware(ALLOWED), getSessionStats);
router.get   ("/",      roleMiddleware(ALLOWED), getSessions);
router.post  ("/",      roleMiddleware(ALLOWED), createSession);
router.put   ("/:id",   roleMiddleware(ALLOWED), updateSession);
router.delete("/:id",   roleMiddleware(ALLOWED), deleteSession);

export default router;
