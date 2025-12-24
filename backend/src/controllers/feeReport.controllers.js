import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateFeeReport } from "../services/feeReport.js";

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
 * - classId
 *
 * Pending:
 * - classId (optional)
 */
export const getFeeReport = asyncHandler(async (req, res) => {
  const {
    type,
    from,
    to,
    year,
    classId,
  } = req.query;

  // 🔴 Mandatory
  if (!type) {
    throw new ApiError(400, "Report type is required");
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
      if (!classId) {
        throw new ApiError(
          400,
          "classId is required for class-wise report"
        );
      }
      break;

    case "pending":
      // classId optional
      break;

    default:
      throw new ApiError(400, "Invalid report type");
  }

  // 🧠 Delegate to service (NO LOGIC HERE)
  const reportData = await generateFeeReport(req.query);

  return res.status(200).json(
    new ApiResponse(
      200,
      reportData,
      `${type} fee report generated successfully`
    )
  );
});
