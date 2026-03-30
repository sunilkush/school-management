import { Router } from "express";
import {
  loginUser,
  getCurrentUser,
  refreshAccessToken,
  logoutUser,
} from "../controllers/user.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";

const router = Router();

router.post("/login", validateBody(["email", "password"]), loginUser);
router.get("/me", auth, getCurrentUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", auth, logoutUser);

export default router;
