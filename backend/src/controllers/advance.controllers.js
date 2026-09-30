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

  // The "already has one" check above and this create are separate steps, so a double-click made two
  // pending advances for the same person. The earlier one stands; this one is withdrawn.
  const [first] = await LoanAdvance.find({ schoolId, employeeId, status: { $in: ["pending", "active"] } })
    .sort({ createdAt: 1, _id: 1 })
    .limit(1)
    .select("_id")
    .lean();
  if (first && String(first._id) !== String(advance._id)) {
    await LoanAdvance.deleteOne({ _id: advance._id });
    throw new ApiError(409, "Employee already has an active or pending advance");
  }

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

  // Only while still pending, in one update. Approve and reject clicked together both saved: the
  // last one won and the history recorded both decisions.
  const updated = await LoanAdvance.findOneAndUpdate(
    { _id: advance._id, schoolId, status: "pending" },
    {
      $set: { status: "active" },
      $push: { history: { action: "approved", amount: advance.totalAmount, note: req.body.note || "Approved by admin", actedBy: req.user._id, actedAt: new Date() } },
    },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "This advance was just decided by someone else — refresh to see it");
  return sendSuccess(res, { data: updated, message: "Advance approved successfully" });
});

export const rejectAdvance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const advance = await LoanAdvance.findOne({ _id: id, schoolId });
  if (!advance) throw new ApiError(404, "Advance not found");
  if (advance.status !== "pending") throw new ApiError(400, `Cannot reject: status is ${advance.status}`);

  const updated = await LoanAdvance.findOneAndUpdate(
    { _id: advance._id, schoolId, status: "pending" },
    {
      $set: { status: "rejected", rejectionReason: req.body.reason || "Rejected by admin" },
      $push: { history: { action: "rejected", amount: 0, note: req.body.reason || "Rejected by admin", actedBy: req.user._id, actedAt: new Date() } },
    },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "This advance was just decided by someone else — refresh to see it");
  return sendSuccess(res, { data: updated, message: "Advance rejected" });
});

export const deductEmi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const advance = await LoanAdvance.findOne({ _id: id, schoolId });
  if (!advance) throw new ApiError(404, "Advance not found");
  if (advance.status !== "active") throw new ApiError(400, "Advance is not active");

  const before = advance.remainingAmount;
  const deduction = Math.min(advance.emiAmount, before);
  const remaining = before - deduction;
  const now = new Date();

  const history = [{
    action: "emi_deducted",
    amount: deduction,
    note: req.body.note || `EMI deduction of ₹${deduction}`,
    actedBy: req.user._id,
    actedAt: now,
  }];
  if (remaining === 0) {
    history.push({ action: "closed", amount: 0, note: "Advance fully repaid", actedBy: req.user._id, actedAt: now });
  }

  // Applied only if the balance is still what was read. Read-modify-save let two deductions (a
  // double-click) both start from the same balance: the balance fell once while the history
  // recorded two EMIs, so the two stopped agreeing.
  const updated = await LoanAdvance.findOneAndUpdate(
    { _id: advance._id, schoolId, status: "active", remainingAmount: before },
    {
      $set: { remainingAmount: remaining, ...(remaining === 0 ? { status: "closed" } : {}) },
      $push: { history: { $each: history } },
    },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "This advance was just updated — refresh and try again");

  return sendSuccess(res, { data: updated, message: "EMI deducted successfully" });
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
