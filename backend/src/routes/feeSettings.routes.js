import { Router } from "express";
import { getSchoolFeeSettings, updateSchoolFeeSettings } from "../controllers/feeSettings.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { feeSettingsUpdateSchema } from "../validators/feeSettings.validator.js";

const router = Router();

router.use(auth);

const FEE_STAFF = ["School Admin", "Accountant"];

router.get("/", roleMiddleware(FEE_STAFF), getSchoolFeeSettings);
router.put("/", roleMiddleware(FEE_STAFF), validateRequest(feeSettingsUpdateSchema), updateSchoolFeeSettings);

export default router;
