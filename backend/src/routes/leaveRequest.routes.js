import { Router } from "express";
import {
  createLeaveRequest,
  getLeaveRequests,
  getMyLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
  getMyLeaveBalance,
  getLeaveBalances,
  adjustLeaveBalance,
} from "../controllers/leaveRequest.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth, createLeaveRequest);
router.get(
  "/",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Principal", "Vice Principal"]),
  getLeaveRequests
);
router.get("/my", auth, getMyLeaveRequests);
// Staff CL / EL balances (services/leaveBalance.service.js).
router.get("/balance/me", auth, getMyLeaveBalance);
router.get(
  "/balances",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Principal", "Vice Principal", "Accountant"]),
  getLeaveBalances
);
router.post("/balances/adjust", auth, roleMiddleware(["Super Admin", "School Admin"]), adjustLeaveBalance);
router.patch(
  "/:id/approve",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Principal", "Vice Principal"]),
  approveLeaveRequest
);
router.patch(
  "/:id/reject",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Principal", "Vice Principal"]),
  rejectLeaveRequest
);
router.delete("/:id", auth, deleteLeaveRequest);

export default router;
