import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationAnalytics,
} from "../controllers/notification.controllers.js";

const router = Router();

router.get("/", auth, listNotifications);
router.get("/analytics", auth, notificationAnalytics);
router.post("/", auth, createNotification);
router.patch("/read-all", auth, markAllNotificationsRead);
router.patch("/:id/read", auth, markNotificationRead);

export default router;