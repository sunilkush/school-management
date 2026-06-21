import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { raiseAlert, getAlerts, resolveAlert, deleteAlert } from "../controllers/emergencyAlert.controllers.js";

const router = Router();
router.use(auth);

const ALLOWED = ["School Admin", "Security", "Super Admin", "Principal"];

router.get   ("/",              roleMiddleware(ALLOWED), getAlerts);
router.post  ("/",              roleMiddleware(ALLOWED), raiseAlert);
router.patch ("/:id/resolve",   roleMiddleware(ALLOWED), resolveAlert);
router.delete("/:id",           roleMiddleware(ALLOWED), deleteAlert);

export default router;
