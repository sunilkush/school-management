import { Router } from "express";
import {
  generateInstallments,
} from "../controllers/feeInstallment.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/generate", generateInstallments);

export default router;
