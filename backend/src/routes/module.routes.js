import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { getMyModules } from "../controllers/module.controllers.js";

const router = Router();

router.get("/my-access", auth, getMyModules);

export default router;
