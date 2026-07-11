import { Router } from "express";
import { registerDeviceToken, unregisterDeviceToken } from "../controllers/deviceToken.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

// Any authenticated role may register/unregister their own device — push targeting is resolved
// server-side from Notification.targetRoles/targetUserIds, not from anything the client asserts.
router.post("/register", registerDeviceToken);
router.post("/unregister", unregisterDeviceToken);

export default router;
