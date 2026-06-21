import { GateEntry } from "../models/GateEntry.model.js";
import { ApiError }   from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

export const createGateEntry = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { name, type, phone, purpose, vehicleNo, gate } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Name is required");

  const entry = await GateEntry.create({
    schoolId, name: name.trim(), type, phone, purpose, vehicleNo, gate,
    loggedBy: req.user._id,
    entryTime: new Date(),
    status: "Inside",
  });

  res.status(201).json(new ApiResponse(201, entry, "Entry logged"));
});

export const getGateEntries = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { date, status, type, page = 1, limit = 50 } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (type)   filter.type   = type;
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.entryTime = { $gte: start, $lt: end };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [entries, total] = await Promise.all([
    GateEntry.find(filter)
      .populate("loggedBy", "name")
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    GateEntry.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { entries, total, page: Number(page) }, "Fetched"));
});

export const markExit = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const entry = await GateEntry.findOne({ _id: req.params.id, schoolId });
  if (!entry) throw new ApiError(404, "Entry not found");

  entry.exitTime = new Date();
  entry.status   = "Exited";
  await entry.save();

  res.json(new ApiResponse(200, entry, "Exit marked"));
});

export const getGateStats = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [inside, todayEntries, todayExits] = await Promise.all([
    GateEntry.countDocuments({ schoolId, status: "Inside" }),
    GateEntry.countDocuments({ schoolId, entryTime: { $gte: todayStart } }),
    GateEntry.countDocuments({ schoolId, exitTime: { $gte: todayStart } }),
  ]);

  res.json(new ApiResponse(200, { inside, todayEntries, todayExits }, "Stats fetched"));
});

export const deleteGateEntry = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const entry = await GateEntry.findOne({ _id: req.params.id, schoolId });
  if (!entry) throw new ApiError(404, "Entry not found");
  await entry.deleteOne();
  res.json(new ApiResponse(200, null, "Deleted"));
});
