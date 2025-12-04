import express from "express"
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

import {
  createFees,
  getAllFees,
  getStudentFees,
  updateFees,
  deleteFees,
  getFeesSummary,
} from "../controllers/fee.controllers.js";

const router = express.Router()

router.use(auth)

router.post("/createFees", createFees)
router.get("/allFees", getAllFees)

router.get("/summary", getFeesSummary)

router.get("/student/:studentId", getStudentFees)

router.put("/:id", updateFees)

router.delete("/:id", deleteFees)

export default router
