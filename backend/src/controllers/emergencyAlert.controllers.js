import { EmergencyAlert } from "../models/EmergencyAlert.model.js";
import { ApiError }       from "../utils/ApiError.js";
import { ApiResponse }    from "../utils/ApiResponse.js";
import { asyncHandler }   from "../utils/asyncHandler.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

export const raiseAlert = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { type, severity, location, description } = req.body;
  if (!type)     throw new ApiError(400, "Alert type is required");
  if (!severity) throw new ApiError(400, "Severity is required");

  const alert = await EmergencyAlert.create({
    schoolId, type, severity, location, description,
    raisedBy: req.user._id, raisedAt: new Date(), isResolved: false,
  });

  res.status(201).json(new ApiResponse(201, alert, "Alert raised"));
});

export const getAlerts = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { isResolved, severity, page = 1, limit = 50 } = req.query;
  const filter = { schoolId };
  if (isResolved !== undefined) filter.isResolved = isResolved === "true";
  if (severity)                 filter.severity   = severity;

  const skip = (Number(page) - 1) * Number(limit);
  const [alerts, total] = await Promise.all([
    EmergencyAlert.find(filter)
      .populate("raisedBy",   "name")
      .populate("resolvedBy", "name")
      .sort({ raisedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    EmergencyAlert.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { alerts, total, page: Number(page) }, "Fetched"));
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const alert = await EmergencyAlert.findOne({ _id: req.params.id, schoolId });
  if (!alert) throw new ApiError(404, "Alert not found");

  alert.isResolved  = true;
  alert.resolvedAt  = new Date();
  alert.resolvedBy  = req.user._id;
  alert.resolution  = req.body.resolution || "";
  await alert.save();

  res.json(new ApiResponse(200, alert, "Alert resolved"));
});

export const deleteAlert = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const alert = await EmergencyAlert.findOne({ _id: req.params.id, schoolId });
  if (!alert) throw new ApiError(404, "Alert not found");
  await alert.deleteOne();
  res.json(new ApiResponse(200, null, "Deleted"));
});
