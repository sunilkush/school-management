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

  const allowed = ["type", "title", "amount", "payoutMonth", "payoutYear", "rule", "status"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) bonus[f] = req.body[f]; });
  await bonus.save();

  return sendSuccess(res, { data: bonus, message: "Bonus updated successfully" });
});

export const deleteBonus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const bonus = await BonusIncentive.findOne({ _id: id, schoolId });
  if (!bonus) throw new ApiError(404, "Bonus not found");
  if (bonus.status === "paid") throw new ApiError(400, "Cannot delete a paid bonus");

  await bonus.deleteOne();
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

  bonus.status = "approved";
  await bonus.save();
  return sendSuccess(res, { data: bonus, message: "Bonus approved" });
});

export const cancelBonus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = getSchoolId(req);

  const bonus = await BonusIncentive.findOne({ _id: id, schoolId });
  if (!bonus) throw new ApiError(404, "Bonus not found");
  if (bonus.status === "paid") throw new ApiError(400, "Cannot cancel a paid bonus");

  bonus.status = "cancelled";
  await bonus.save();
  return sendSuccess(res, { data: bonus, message: "Bonus cancelled" });
});
