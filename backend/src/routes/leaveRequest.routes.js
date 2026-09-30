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
  createCompOffClaim,
  getMyCompOffClaims,
  getCompOffClaims,
  approveCompOffClaim,
  rejectCompOffClaim,
  deleteCompOffClaim,
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
// Comp Off: a Sunday or holiday worked, claimed by the staff member and approved by an admin.
const COMP_OFF_DECIDERS = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
router.post("/comp-off", auth, createCompOffClaim);
router.get("/comp-off/my", auth, getMyCompOffClaims);
router.get("/comp-off", auth, roleMiddleware(COMP_OFF_DECIDERS), getCompOffClaims);
router.patch("/comp-off/:id/approve", auth, roleMiddleware(COMP_OFF_DECIDERS), approveCompOffClaim);
router.patch("/comp-off/:id/reject", auth, roleMiddleware(COMP_OFF_DECIDERS), rejectCompOffClaim);
router.delete("/comp-off/:id", auth, deleteCompOffClaim);
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
