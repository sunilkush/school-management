import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { createCallLog, getCallLogs, updateCallLog, deleteCallLog } from "../controllers/callLog.controllers.js";

const router = Router();
router.use(auth);

const ALLOWED = ["School Admin", "Receptionist", "Super Admin"];

router.get   ("/",    roleMiddleware(ALLOWED), getCallLogs);
router.post  ("/",    roleMiddleware(ALLOWED), createCallLog);
router.put   ("/:id", roleMiddleware(ALLOWED), updateCallLog);
router.delete("/:id", roleMiddleware(ALLOWED), deleteCallLog);

export default router;
