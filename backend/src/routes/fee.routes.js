import express from "express";
import {
  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
} from "../controllers/fee.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const FEE_ROLES = ["Super Admin", "School Admin", "Accountant"];

router.post("/createFees", auth, roleMiddleware(FEE_ROLES), createFeeStructure);
router.get("/allFees", auth, roleMiddleware(FEE_ROLES), getFeeStructures);
router.put("/:id", auth, roleMiddleware(["School Admin", "Accountant"]), updateFeeStructure);
router.delete("/:id", auth, roleMiddleware(["School Admin", "Accountant"]), deleteFeeStructure);

export default router;
