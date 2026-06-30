import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  enable2FA,
  confirm2FA,
  disable2FA,
  requestDisable2FAOTP,
  verifyLogin2FA,
  get2FAStatus,
} from "../controllers/twoFactor.controllers.js";

const router = Router();

// Public: verify 2FA after password login (no auth token yet)
router.post("/verify-login", verifyLogin2FA);

// Protected: manage 2FA settings
router.use(auth);
router.get("/status", get2FAStatus);
router.post("/enable", enable2FA);
router.post("/confirm-enable", confirm2FA);
router.post("/request-disable-otp", requestDisable2FAOTP);
router.post("/disable", disable2FA);

export default router;
