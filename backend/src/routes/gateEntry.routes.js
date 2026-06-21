import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { createGateEntry, getGateEntries, markExit, getGateStats, deleteGateEntry } from "../controllers/gateEntry.controllers.js";

const router = Router();
router.use(auth);

const ALLOWED = ["School Admin", "Receptionist", "Security", "Super Admin"];

router.get   ("/stats",     roleMiddleware(ALLOWED), getGateStats);
router.get   ("/",          roleMiddleware(ALLOWED), getGateEntries);
router.post  ("/",          roleMiddleware(ALLOWED), createGateEntry);
router.patch ("/:id/exit",  roleMiddleware(ALLOWED), markExit);
router.delete("/:id",       roleMiddleware(ALLOWED), deleteGateEntry);

export default router;
