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

router.post("/", createFeeStructure);
router.get("/", getFeeStructures);
router.put("/:id", updateFeeStructure);
router.delete("/:id", deleteFeeStructure);

export default router;
