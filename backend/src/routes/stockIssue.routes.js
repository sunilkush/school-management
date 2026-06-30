import express from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { createStockIssue, deleteStockIssue, getStockIssues, processReturn } from "../controllers/stockIssue.controllers.js";

const router = express.Router();
const MANAGE = ["Super Admin", "School Admin", "Principal", "IT Support", "Librarian"];

router.use(auth);
router.get("/",            roleMiddleware([...MANAGE, "Accountant"]), getStockIssues);
router.post("/",           roleMiddleware(MANAGE), createStockIssue);
router.patch("/:id/return", roleMiddleware(MANAGE), processReturn);
router.delete("/:id",      roleMiddleware(MANAGE), deleteStockIssue);

export default router;
