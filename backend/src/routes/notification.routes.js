import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { createNotification, listNotifications } from "../controllers/notification.controllers.js";

const router = Router();

router.get("/", auth, listNotifications);
router.post("/", auth, createNotification);

export default router;
