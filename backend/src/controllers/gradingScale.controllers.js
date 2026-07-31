import { GradingScale } from "../models/GradingScale.model.js";
import { DEFAULT_GRADES } from "../services/gradingScale.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolIdFromReq } from "../utils/resolveSchoolId.js";

// Same tenant-trust rule used across dashboard/report endpoints: the query param only wins for
// Super Admin (who has no school of their own), otherwise every caller reads/writes their own
// school's scale regardless of what they pass in the query string.
const resolveTargetSchoolId = (req) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin" || req.user?.roleId?.name === "Super Admin";
  const ownSchoolId = resolveSchoolIdFromReq(req);
  return isSuperAdmin ? (req.query.schoolId || ownSchoolId) : ownSchoolId;
};

const validateGrades = (grades) => {
  if (!Array.isArray(grades) || grades.length === 0) {
    throw new ApiError(400, "grades must be a non-empty array");
  }
  const seen = new Set();
  grades.forEach((band) => {
    if (!band?.grade || typeof band.grade !== "string" || !band.grade.trim()) {
      throw new ApiError(400, "Each grade band needs a non-empty grade label");
    }
    const min = Number(band.minPercentage);
    if (!Number.isFinite(min) || min < 0 || min > 100) {
      throw new ApiError(400, `Invalid minPercentage for grade "${band.grade}" — must be between 0 and 100`);
    }
    if (seen.has(min)) {
      throw new ApiError(400, `Duplicate minPercentage ${min} — each band needs a distinct threshold`);
    }
    seen.add(min);
  });
  if (!grades.some((b) => Number(b.minPercentage) === 0)) {
    throw new ApiError(400, "One grade band must have minPercentage 0 to cover the lowest scores");
  }
};

export const getGradingScale = asyncHandler(async (req, res) => {
  const schoolId = resolveTargetSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const doc = await GradingScale.findOne({ schoolId });
  if (!doc) {
    return res
      .status(200)
      .json(new ApiResponse(200, { schoolId, grades: DEFAULT_GRADES, isDefault: true }, "Default grading scale (not yet customized)"));
  }
  res.status(200).json(new ApiResponse(200, doc, "Grading scale fetched"));
});

export const updateGradingScale = asyncHandler(async (req, res) => {
  const schoolId = resolveTargetSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const grades = (req.body.grades || []).map((b) => ({
    grade: String(b.grade).trim(),
    minPercentage: Number(b.minPercentage),
  }));
  validateGrades(grades);

  const doc = await GradingScale.findOneAndUpdate(
    { schoolId },
    { $set: { grades, updatedBy: req.user._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(new ApiResponse(200, doc, "Grading scale updated"));
});
