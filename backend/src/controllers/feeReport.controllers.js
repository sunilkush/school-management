import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateFeeReport } from "../services/feeReport.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";

/**
 * GET /fees/report
 *
 * Common Query Params:
 * - type: daily | monthly | class | pending
 * - schoolId
 * - sessionId
 *
 * Daily:
 * - from
 * - to
 *
 * Monthly:
 * - year
 *
 * Class Wise:
 * - schoolClassId
 *
 * Pending:
 * - schoolClassId (optional)
 */
export const getFeeReport = asyncHandler(async (req, res) => {
  const {
    type,
    from,
    to,
    year,
    schoolClassId,
    academicYearId,
  } = req.query;

  // 🔴 Mandatory
  if (!type) {
    throw new ApiError(400, "Report type is required");
  }

  // The schoolId query param is only trusted for Super Admin — otherwise any School
  // Admin/Accountant/Principal could read another school's fee report just by passing a
  // different schoolId, since nothing else here checks tenancy.
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const userSchoolId = resolveSchoolId(req.user);
  const schoolId = isSuperAdmin ? (req.query.schoolId || userSchoolId) : userSchoolId;
  if (!schoolId) {
    throw new ApiError(400, "schoolId is required");
  }

  // 🔍 Type-wise validations (SMART)
  switch (type) {
    case "daily":
      if (!from || !to) {
        throw new ApiError(
          400,
          "from and to dates are required for daily report"
        );
      }
      break;

    case "monthly":
      if (!year) {
        throw new ApiError(
          400,
          "year is required for monthly report"
        );
      }
      break;

    case "class":
      if (!schoolClassId) {
        throw new ApiError(
          400,
          "schoolClassId is required for class-wise report"
        );
      }
      break;

    case "pending":
      // schoolClassId optional
      break;

    default:
      throw new ApiError(400, "Invalid report type");
  }

  // 🧠 Delegate to service (NO LOGIC HERE)
  const reportData = await generateFeeReport({ ...req.query, schoolId, academicYearId });

  return res.status(200).json(
    new ApiResponse(
      200,
      reportData,
      `${type} fee report generated successfully`
    )
  );
});
