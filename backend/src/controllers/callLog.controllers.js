import { CallLog }    from "../models/CallLog.model.js";
import { ApiError }   from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

export const createCallLog = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { callerName, phone, type, purpose, duration, notes } = req.body;
  if (!callerName?.trim()) throw new ApiError(400, "Caller name is required");

  const log = await CallLog.create({
    schoolId,
    callerName: callerName.trim(),
    phone, type, purpose, duration, notes,
    handledBy: req.user._id,
    callTime: new Date(),
  });

  res.status(201).json(new ApiResponse(201, log, "Call logged"));
});

export const getCallLogs = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { type, date, page = 1, limit = 50 } = req.query;
  const filter = { schoolId };
  if (type) filter.type = type;
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.callTime = { $gte: start, $lt: end };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    CallLog.find(filter)
      .populate("handledBy", "name")
      .sort({ callTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    CallLog.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { logs, total, page: Number(page) }, "Fetched"));
});

export const updateCallLog = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const log = await CallLog.findOne({ _id: req.params.id, schoolId });
  if (!log) throw new ApiError(404, "Call log not found");

  const fields = ["callerName", "phone", "type", "purpose", "duration", "notes"];
  fields.forEach((f) => { if (req.body[f] !== undefined) log[f] = req.body[f]; });
  await log.save();

  res.json(new ApiResponse(200, log, "Updated"));
});

export const deleteCallLog = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const log = await CallLog.findOne({ _id: req.params.id, schoolId });
  if (!log) throw new ApiError(404, "Call log not found");
  await log.deleteOne();
  res.json(new ApiResponse(200, null, "Deleted"));
});
