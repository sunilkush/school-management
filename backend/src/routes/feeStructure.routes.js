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

router.post("/",roleMiddleware("School Admin"), createFeeStructure);
router.get("/",roleMiddleware("School Admin"), getFeeStructures);
router.put("/:id",roleMiddleware("School Admin"), updateFeeStructure);
router.delete("/:id",roleMiddleware("School Admin"), deleteFeeStructure);

export default router;
