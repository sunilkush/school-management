import express from "express";
import {
  createIncome, getAllIncome, getIncomeById,
  updateIncome, deleteIncome, getIncomeSummary,
} from "../controllers/income.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const FINANCE_ROLES = ["School Admin", "Accountant"];
const READ_ROLES    = ["School Admin", "Accountant", "Principal", "Vice Principal"];

router.post  ("/",         auth, roleMiddleware(FINANCE_ROLES), createIncome);
router.get   ("/summary",  auth, roleMiddleware(READ_ROLES),    getIncomeSummary);
router.get   ("/",         auth, roleMiddleware(READ_ROLES),    getAllIncome);
router.get   ("/:id",      auth, roleMiddleware(READ_ROLES),    getIncomeById);
router.put   ("/:id",      auth, roleMiddleware(FINANCE_ROLES), updateIncome);
router.delete("/:id",      auth, roleMiddleware(FINANCE_ROLES), deleteIncome);

export default router;
