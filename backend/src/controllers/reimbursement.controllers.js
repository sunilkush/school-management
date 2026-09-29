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

  // Only while it is still with the manager, in one update. Reading the claim, changing it and
  // saving meant an approve and a reject sent together both succeeded and the last save won: a
  // claim could end up rejected with its manager step marked approved, or approved while
  // carrying a rejection reason.
  const updated = await Reimbursement.findOneAndUpdate(
    { _id: id, schoolId, status: "pending_manager" },
    {
      $set: {
        status: "pending_finance",
        "approvals.$[step].status": "approved",
        "approvals.$[step].actedBy": req.user._id,
        "approvals.$[step].actedAt": new Date(),
        "approvals.$[step].remark": req.body.remark || "",
      },
    },
    { new: true, runValidators: true, arrayFilters: [{ "step.level": "manager" }] }
  );
  if (!updated) throw new ApiError(409, "This claim was just decided by someone else — refresh to see it");

  return sendSuccess(res, { data: updated, message: "Approved by manager — awaiting finance" });
});

export const approveFinanceReimbursement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const reimb = await Reimbursement.findOne({ _id: id, schoolId });
  if (!reimb) throw new ApiError(404, "Reimbursement not found");
  if (reimb.status !== "pending_finance") throw new ApiError(400, "Not awaiting finance approval");

  // Only while it is still with finance — same reason as the manager step above.
  const updated = await Reimbursement.findOneAndUpdate(
    { _id: id, schoolId, status: "pending_finance" },
    {
      $set: {
        status: "approved",
        "approvals.$[step].status": "approved",
        "approvals.$[step].actedBy": req.user._id,
        "approvals.$[step].actedAt": new Date(),
        "approvals.$[step].remark": req.body.remark || "",
      },
    },
    { new: true, runValidators: true, arrayFilters: [{ "step.level": "finance" }] }
  );
  if (!updated) throw new ApiError(409, "This claim was just decided by someone else — refresh to see it");

  return sendSuccess(res, { data: updated, message: "Reimbursement fully approved" });
});

export const rejectReimbursement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const reimb = await Reimbursement.findOne({ _id: id, schoolId });
  if (!reimb) throw new ApiError(404, "Reimbursement not found");
  if (!["pending_manager", "pending_finance"].includes(reimb.status)) {
    throw new ApiError(400, "Cannot reject: current status does not allow rejection");
  }

  // Only while it is still awaiting a decision, so a rejection cannot land on top of an
  // approval that was accepted a moment earlier.
  const updated = await Reimbursement.findOneAndUpdate(
    { _id: id, schoolId, status: { $in: ["pending_manager", "pending_finance"] } },
    { $set: { status: "rejected", rejectionReason: req.body.reason || "Rejected" } },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "This claim was just decided by someone else — refresh to see it");

  return sendSuccess(res, { data: updated, message: "Reimbursement rejected" });
});

export const deleteReimbursement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const reimb = await Reimbursement.findOne({ _id: id, schoolId });
  if (!reimb) throw new ApiError(404, "Reimbursement not found");
  if (!["pending_manager", "rejected"].includes(reimb.status)) {
    throw new ApiError(400, "Only pending or rejected claims can be deleted");
  }

  // Deleting checks the status in the same step, so a claim approved at that moment is kept
  // rather than removed out from under the approval.
  const removed = await Reimbursement.findOneAndDelete({
    _id: id,
    schoolId,
    status: { $in: ["pending_manager", "rejected"] },
  });
  if (!removed) throw new ApiError(409, "This claim was just decided by someone else — refresh to see it");
  return sendSuccess(res, { message: "Reimbursement deleted" });
});
