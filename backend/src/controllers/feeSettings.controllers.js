import { School } from "../models/school.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { requireSchoolId } from "../utils/resolveSchoolId.js";
import { getFeeSettings, normalizeFeeSettings } from "../services/feeSchedule.service.js";

/** GET /fee-settings — the caller's own school's due day and late-fine rule. */
export const getSchoolFeeSettings = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  return sendSuccess(res, { message: "Fee settings fetched", data: await getFeeSettings(schoolId) });
});

/**
 * PUT /fee-settings — always the caller's own school; there is no schoolId in the body to point
 * at another one.
 *
 * A new due day applies to schedules generated from now on — installments already generated keep
 * their dates. A changed late-fine rule applies to every unpaid installment the next time it is
 * refreshed (opening a student's fees, taking a payment, or the nightly job).
 */
export const updateSchoolFeeSettings = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { dueDay, lateFine = {} } = req.body;

  const next = normalizeFeeSettings({ dueDay, lateFine });

  if (next.lateFine.enabled && !(next.lateFine.amount > 0)) {
    throw new ApiError(400, "Enter a late fine amount greater than 0, or turn late fine off");
  }
  if (next.lateFine.type === "fixed") next.lateFine.maxAmount = 0;

  const school = await School.findByIdAndUpdate(
    schoolId,
    { $set: { feeSettings: next } },
    { new: true, runValidators: true }
  ).select("feeSettings");
  if (!school) throw new ApiError(404, "School not found");

  return sendSuccess(res, { message: "Fee settings saved", data: normalizeFeeSettings(school.feeSettings) });
});
