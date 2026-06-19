import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createReimbursement,
  getReimbursements,
  approveManagerReimbursement,
  approveFinanceReimbursement,
  rejectReimbursement,
  deleteReimbursement,
} from "../controllers/reimbursement.controllers.js";

const router = Router();

const FINANCE_ROLES  = ["Super Admin", "School Admin", "Accountant"];
const ADMIN_ROLES    = ["Super Admin", "School Admin", "Accountant", "Principal"];
const ALL_STAFF      = [
  "Super Admin", "School Admin", "Accountant", "Principal",
  "Teacher", "Employee", "Staff", "Support Staff",
  "Vice Principal", "Librarian", "Hostel Warden",
];

router.post("/",                    auth, roleMiddleware(ALL_STAFF),    createReimbursement);
router.get("/",                     auth, roleMiddleware(ADMIN_ROLES),  getReimbursements);
router.put("/:id/manager-approve",  auth, roleMiddleware(ADMIN_ROLES),  approveManagerReimbursement);
router.put("/:id/finance-approve",  auth, roleMiddleware(FINANCE_ROLES), approveFinanceReimbursement);
router.put("/:id/reject",           auth, roleMiddleware(ADMIN_ROLES),  rejectReimbursement);
router.delete("/:id",               auth, roleMiddleware(ADMIN_ROLES),  deleteReimbursement);

export default router;
