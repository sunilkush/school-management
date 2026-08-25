import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/webhook.controllers.js";

const router = Router();

// Public — see PUBLIC_API_ROUTE_PATTERNS in auth.middleware.js. Authenticity is enforced by
// HMAC signature verification inside the controller, not by auth/session middleware.
router.post("/razorpay", handleRazorpayWebhook);

export default router;
