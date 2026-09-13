import { Router } from "express";
import {
  activateSchoolGateway,
  deactivateSchoolGateway,
  getSchoolGateways,
  saveSchoolGateway,
  testSchoolGateway,
} from "../controllers/paymentGateway.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { gatewayProviderSchema, gatewaySaveSchema } from "../validators/paymentGateway.validator.js";

const router = Router();

router.use(auth);

// The money lands in the school's own merchant account, so the school's own admin manages it.
const SCHOOL_ADMIN = ["School Admin"];

router.get("/", roleMiddleware(SCHOOL_ADMIN), getSchoolGateways);
router.put("/:provider", roleMiddleware(SCHOOL_ADMIN), validateRequest(gatewaySaveSchema), saveSchoolGateway);
router.post("/:provider/test", roleMiddleware(SCHOOL_ADMIN), validateRequest(gatewayProviderSchema), testSchoolGateway);
router.post("/:provider/activate", roleMiddleware(SCHOOL_ADMIN), validateRequest(gatewayProviderSchema), activateSchoolGateway);
router.post("/:provider/deactivate", roleMiddleware(SCHOOL_ADMIN), validateRequest(gatewayProviderSchema), deactivateSchoolGateway);

export default router;
