import { Reimbursement } from "../models/Reimbursement.model.js";
import { Employee } from "../models/Employee.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";

const getSchoolId = (req) => {
  const requested = req.body?.schoolId || req.query?.schoolId;
  const userSchool = req.user?.schoolId;
  if (req.userRole?.name === "Super Admin" && requested) return requested;
  return userSchool || requested;
};

export const createReimbursement = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context required");

  const employee = await Employee.findOne({ _id: req.body.employeeId, schoolId }).lean();
  if (!employee) throw new ApiError(404, "Employee not found");

  const reimbursement = await Reimbursement.create({
    ...req.body,
    schoolId,
    createdBy: req.user._id,
  });

  return sendSuccess(res, { data: reimbursement, message: "Reimbursement claim submitted" }, 201);
});

export const getReimbursements = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context required");

  const { status, type, employeeId, academicYearId } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (employeeId) filter.employeeId = employeeId;
  if (academicYearId) filter.academicYearId = academicYearId;

  const reimbursements = await Reimbursement.find(filter)
    .populate({ path: "employeeId", populate: { path: "userId", select: "name email" } })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { data: reimbursements });
});

export const approveManagerReimbursement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const reimb = await Reimbursement.findOne({ _id: id, schoolId });
  if (!reimb) throw new ApiError(404, "Reimbursement not found");
  if (reimb.status !== "pending_manager") throw new ApiError(400, "Not awaiting manager approval");

  const managerApproval = reimb.approvals.find((a) => a.level === "manager");
  if (managerApproval) {
    managerApproval.status = "approved";
    managerApproval.actedBy = req.user._id;
    managerApproval.actedAt = new Date();
    managerApproval.remark = req.body.remark || "";
  }
  reimb.status = "pending_finance";
  await reimb.save();

  return sendSuccess(res, { data: reimb, message: "Approved by manager — awaiting finance" });
});

export const approveFinanceReimbursement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const reimb = await Reimbursement.findOne({ _id: id, schoolId });
  if (!reimb) throw new ApiError(404, "Reimbursement not found");
  if (reimb.status !== "pending_finance") throw new ApiError(400, "Not awaiting finance approval");

  const financeApproval = reimb.approvals.find((a) => a.level === "finance");
  if (financeApproval) {
    financeApproval.status = "approved";
    financeApproval.actedBy = req.user._id;
    financeApproval.actedAt = new Date();
    financeApproval.remark = req.body.remark || "";
  }
  reimb.status = "approved";
  await reimb.save();

  return sendSuccess(res, { data: reimb, message: "Reimbursement fully approved" });
});

export const rejectReimbursement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const reimb = await Reimbursement.findOne({ _id: id, schoolId });
  if (!reimb) throw new ApiError(404, "Reimbursement not found");
  if (!["pending_manager", "pending_finance"].includes(reimb.status)) {
    throw new ApiError(400, "Cannot reject: current status does not allow rejection");
  }

  reimb.status = "rejected";
  reimb.rejectionReason = req.body.reason || "Rejected";
  await reimb.save();

  return sendSuccess(res, { data: reimb, message: "Reimbursement rejected" });
});

export const deleteReimbursement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const reimb = await Reimbursement.findOne({ _id: id, schoolId });
  if (!reimb) throw new ApiError(404, "Reimbursement not found");
  if (!["pending_manager", "rejected"].includes(reimb.status)) {
    throw new ApiError(400, "Only pending or rejected claims can be deleted");
  }

  await reimb.deleteOne();
  return sendSuccess(res, { message: "Reimbursement deleted" });
});
