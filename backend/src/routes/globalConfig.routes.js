import { Router } from "express";
import { getGlobalConfig, updateGlobalConfig } from "../controllers/globalConfig.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/", auth, roleMiddleware("Super Admin"), getGlobalConfig);
router.put(
  "/",
  auth,
  roleMiddleware("Super Admin"),
  upload.fields([{ name: "logo", maxCount: 1 }]),
  updateGlobalConfig
);

export default router;
