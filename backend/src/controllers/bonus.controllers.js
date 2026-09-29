import { BonusIncentive } from "../models/BonusIncentive.model.js";
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

export const createBonus = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context required");

  const employee = await Employee.findOne({ _id: req.body.employeeId, schoolId }).lean();
  if (!employee) throw new ApiError(404, "Employee not found");

  const bonus = await BonusIncentive.create({
    ...req.body,
    schoolId,
    createdBy: req.user._id,
  });

  return sendSuccess(res, { data: bonus, message: "Bonus/incentive created successfully" }, 201);
});

export const getBonuses = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context required");

  const { status, type, employeeId, payoutYear, payoutMonth, academicYearId } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (employeeId) filter.employeeId = employeeId;
  if (payoutYear) filter.payoutYear = Number(payoutYear);
  if (payoutMonth) filter.payoutMonth = Number(payoutMonth);
  if (academicYearId) filter.academicYearId = academicYearId;

  const bonuses = await BonusIncentive.find(filter)
    .populate({ path: "employeeId", populate: { path: "userId", select: "name email" } })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { data: bonuses });
});

export const updateBonus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const bonus = await BonusIncentive.findOne({ _id: id, schoolId });
  if (!bonus) throw new ApiError(404, "Bonus not found");
  if (bonus.status === "paid") throw new ApiError(400, "Cannot edit a paid bonus");

  // The check above and the save were separate steps, so an edit sent while the bonus was being
  // marked paid still went through and changed the amount of something already paid out. The
  // edit now only applies while the bonus is still unpaid.
  const allowed = ["type", "title", "amount", "payoutMonth", "payoutYear", "rule", "status"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await BonusIncentive.findOneAndUpdate(
    { _id: id, schoolId, status: { $ne: "paid" } },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "This bonus was just paid — refresh to see it");

  return sendSuccess(res, { data: updated, message: "Bonus updated successfully" });
});

export const deleteBonus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const bonus = await BonusIncentive.findOne({ _id: id, schoolId });
  if (!bonus) throw new ApiError(404, "Bonus not found");
  if (bonus.status === "paid") throw new ApiError(400, "Cannot delete a paid bonus");

  // Deleting checks it is still unpaid in the same step, so a bonus paid at that moment stays.
  const removed = await BonusIncentive.findOneAndDelete({ _id: id, schoolId, status: { $ne: "paid" } });
  if (!removed) throw new ApiError(409, "This bonus was just paid — refresh to see it");
  return sendSuccess(res, { message: "Bonus deleted successfully" });
});

export const approveBonus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const bonus = await BonusIncentive.findOne({ _id: id, schoolId });
  if (!bonus) throw new ApiError(404, "Bonus not found");
  if (bonus.status === "paid" || bonus.status === "approved") {
    throw new ApiError(400, `Bonus is already ${bonus.status}`);
  }

  // Only from a state that can still be approved, in one update. Approve and cancel clicked
  // together both saved and the last one won.
  const updated = await BonusIncentive.findOneAndUpdate(
    { _id: id, schoolId, status: { $nin: ["paid", "approved"] } },
    { $set: { status: "approved" } },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "This bonus was just decided by someone else — refresh to see it");
  return sendSuccess(res, { data: updated, message: "Bonus approved" });
});

export const cancelBonus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const bonus = await BonusIncentive.findOne({ _id: id, schoolId });
  if (!bonus) throw new ApiError(404, "Bonus not found");
  if (bonus.status === "paid") throw new ApiError(400, "Cannot cancel a paid bonus");

  // Only while still unpaid — same reason as approving above.
  const updated = await BonusIncentive.findOneAndUpdate(
    { _id: id, schoolId, status: { $ne: "paid" } },
    { $set: { status: "cancelled" } },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(409, "This bonus was just paid — refresh to see it");
  return sendSuccess(res, { data: updated, message: "Bonus cancelled" });
});
