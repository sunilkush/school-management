import { Router } from "express";
import { handleGatewayWebhook, handleRazorpayWebhook } from "../controllers/webhook.controllers.js";

const router = Router();

// Public — see PUBLIC_API_ROUTE_PATTERNS in auth.middleware.js. Authenticity is enforced by
// HMAC signature verification inside the controller, not by auth/session middleware.
router.post("/razorpay", handleRazorpayWebhook);
// Each school's fee gateway, e.g. /webhooks/gateway/payu/<schoolId>. The school's settings screen
// shows the exact URL to paste into the gateway's dashboard.
router.post("/gateway/:provider/:schoolId", handleGatewayWebhook);

export default router;
