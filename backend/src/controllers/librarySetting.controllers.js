import { LibrarySetting } from "../models/LibrarySetting.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolIdFromReq as resolveSchoolId } from "../utils/resolveSchoolId.js";

export const getLibrarySettings = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  let settings = await LibrarySetting.findOne({ schoolId });
  if (!settings) {
    settings = await LibrarySetting.create({ schoolId });
  }

  res.status(200).json(new ApiResponse(200, settings, "Library settings fetched"));
});

export const updateLibrarySettings = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const allowedFields = [
    "maxBooksPerStudent", "maxBooksPerTeacher", "maxBooksPerStaff",
    "maxDaysToReturnStudent", "maxDaysToReturnTeacher",
    "gracePeriodDays", "finePerDay", "maxFinePerBook",
    "lostBookFine", "damagedBookFine",
    "allowReservation", "autoMarkOverdue", "autoSendReminders",
    "currentSessionLabel",
  ];

  const updates = { updatedBy: req.user._id };
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  // Limits, days and fines are whole, non-negative numbers. Only the form said so: the API saved a
  // negative fine (which pays the borrower) or a limit of -1.
  const NUMERIC = allowedFields.slice(0, 10);
  for (const field of NUMERIC) {
    if (updates[field] === undefined) continue;
    const value = Number(updates[field]);
    if (!Number.isFinite(value) || value < 0) throw new ApiError(400, `${field} must be a number of 0 or more`);
    updates[field] = value;
  }

  const settings = await LibrarySetting.findOneAndUpdate(
    { schoolId },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(new ApiResponse(200, settings, "Library settings updated"));
});
