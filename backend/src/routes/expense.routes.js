import express from "express";
import {
  createExpense, getAllExpenses, getExpenseById,
  updateExpense, deleteExpense, getExpenseSummary,
} from "../controllers/expense.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const FINANCE_ROLES = ["School Admin", "Accountant"];
const READ_ROLES    = ["School Admin", "Accountant", "Principal", "Vice Principal"];

router.post  ("/",         auth, roleMiddleware(FINANCE_ROLES), createExpense);
router.get   ("/summary",  auth, roleMiddleware(READ_ROLES),    getExpenseSummary);
router.get   ("/",         auth, roleMiddleware(READ_ROLES),    getAllExpenses);
router.get   ("/:id",      auth, roleMiddleware(READ_ROLES),    getExpenseById);
router.put   ("/:id",      auth, roleMiddleware(FINANCE_ROLES), updateExpense);
router.delete("/:id",      auth, roleMiddleware(FINANCE_ROLES), deleteExpense);

export default router;
