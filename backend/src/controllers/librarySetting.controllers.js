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

  const settings = await LibrarySetting.findOneAndUpdate(
    { schoolId },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(new ApiResponse(200, settings, "Library settings updated"));
});
