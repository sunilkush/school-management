import { LoanAdvance } from "../models/LoanAdvance.model.js";
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

export const createAdvance = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context required");

  const { employeeId, academicYearId, totalAmount, emiAmount, startMonth, note } = req.body;

  const employee = await Employee.findOne({ _id: employeeId, schoolId }).lean();
  if (!employee) throw new ApiError(404, "Employee not found in this school");

  const existing = await LoanAdvance.findOne({
    schoolId, employeeId, status: { $in: ["pending", "active"] },
  });
  if (existing) throw new ApiError(409, "Employee already has an active or pending advance");

  const advance = await LoanAdvance.create({
    schoolId,
    academicYearId,
    employeeId,
    createdBy: req.user._id,
    totalAmount,
    remainingAmount: totalAmount,
    emiAmount,
    startMonth: new Date(startMonth),
    history: [{
      action: "created",
      amount: totalAmount,
      note: note || "Advance requested",
      actedBy: req.user._id,
    }],
  });

  return sendSuccess(res, { data: advance, message: "Advance request submitted successfully" }, 201);
});

export const getAdvances = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context required");

  const { status, employeeId, academicYearId } = req.query;
  const filter = { schoolId };
  if (status) filter.status = status;
  if (employeeId) filter.employeeId = employeeId;
  if (academicYearId) filter.academicYearId = academicYearId;

  const advances = await LoanAdvance.find(filter)
    .populate({ path: "employeeId", populate: { path: "userId", select: "name email" } })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { data: advances });
});

export const getMyAdvances = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId;

  const employee = await Employee.findOne({ userId: req.user._id, schoolId }).lean();
  if (!employee) throw new ApiError(404, "Employee profile not found");

  const advances = await LoanAdvance.find({ schoolId, employeeId: employee._id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { data: advances });
});

export const approveAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const advance = await LoanAdvance.findOne({ _id: id, schoolId });
  if (!advance) throw new ApiError(404, "Advance not found");
  if (advance.status !== "pending") throw new ApiError(400, `Cannot approve: status is ${advance.status}`);

  advance.status = "active";
  advance.history.push({
    action: "approved",
    amount: advance.totalAmount,
    note: req.body.note || "Approved by admin",
    actedBy: req.user._id,
  });

  await advance.save();
  return sendSuccess(res, { data: advance, message: "Advance approved successfully" });
});

export const rejectAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const advance = await LoanAdvance.findOne({ _id: id, schoolId });
  if (!advance) throw new ApiError(404, "Advance not found");
  if (advance.status !== "pending") throw new ApiError(400, `Cannot reject: status is ${advance.status}`);

  advance.status = "rejected";
  advance.rejectionReason = req.body.reason || "Rejected by admin";
  advance.history.push({
    action: "rejected",
    amount: 0,
    note: req.body.reason || "Rejected by admin",
    actedBy: req.user._id,
  });

  await advance.save();
  return sendSuccess(res, { data: advance, message: "Advance rejected" });
});

export const deductEmi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const advance = await LoanAdvance.findOne({ _id: id, schoolId });
  if (!advance) throw new ApiError(404, "Advance not found");
  if (advance.status !== "active") throw new ApiError(400, "Advance is not active");

  const deduction = Math.min(advance.emiAmount, advance.remainingAmount);
  advance.remainingAmount -= deduction;

  advance.history.push({
    action: "emi_deducted",
    amount: deduction,
    note: req.body.note || `EMI deduction of ₹${deduction}`,
    actedBy: req.user._id,
  });

  if (advance.remainingAmount === 0) {
    advance.status = "closed";
    advance.history.push({
      action: "closed",
      amount: 0,
      note: "Advance fully repaid",
      actedBy: req.user._id,
    });
  }

  await advance.save();
  return sendSuccess(res, { data: advance, message: "EMI deducted successfully" });
});

export const closeAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const advance = await LoanAdvance.findOne({ _id: id, schoolId });
  if (!advance) throw new ApiError(404, "Advance not found");
  if (advance.status !== "active") throw new ApiError(400, "Only active advances can be closed");

  advance.status = "closed";
  advance.remainingAmount = 0;
  advance.history.push({
    action: "closed",
    amount: 0,
    note: req.body.note || "Closed manually by admin",
    actedBy: req.user._id,
  });

  await advance.save();
  return sendSuccess(res, { data: advance, message: "Advance closed successfully" });
});
