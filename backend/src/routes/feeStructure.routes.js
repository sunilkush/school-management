import { Router } from "express";
import {
  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
} from "../controllers/feeStructure.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);
const ADMIN_ONLY = ["Super Admin", "School Admin", "Accountant"];

router.post("/",roleMiddleware(ADMIN_ONLY), createFeeStructure);
router.get("/",roleMiddleware(ADMIN_ONLY), getFeeStructures);
router.put("/:id",roleMiddleware(ADMIN_ONLY), updateFeeStructure);
router.delete("/:id",roleMiddleware(ADMIN_ONLY), deleteFeeStructure);

export default router;
