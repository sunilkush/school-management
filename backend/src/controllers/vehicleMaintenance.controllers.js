import { VehicleMaintenance } from "../models/VehicleMaintenance.model.js";
import { ApiError }           from "../utils/ApiError.js";
import { ApiResponse }        from "../utils/ApiResponse.js";
import { asyncHandler }       from "../utils/asyncHandler.js";

const getSchoolId = (req) => req.user.school?._id || req.user.schoolId;

export const createMaintenance = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { vehicleId, vehicleNo, vehicleName, serviceType, scheduledDate, estimatedCost, notes } = req.body;
  if (!serviceType)   throw new ApiError(400, "Service type is required");
  if (!scheduledDate) throw new ApiError(400, "Scheduled date is required");

  const record = await VehicleMaintenance.create({
    schoolId, vehicleId, vehicleNo, vehicleName, serviceType,
    scheduledDate: new Date(scheduledDate),
    estimatedCost: Number(estimatedCost) || 0,
    notes, recordedBy: req.user._id, status: "Scheduled",
  });

  res.status(201).json(new ApiResponse(201, record, "Maintenance record created"));
});

export const getMaintenanceRecords = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) throw new ApiError(400, "School context not found");

  const { status, vehicleId, page = 1, limit = 50 } = req.query;
  const filter = { schoolId };
  if (status)    filter.status    = status;
  if (vehicleId) filter.vehicleId = vehicleId;

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    VehicleMaintenance.find(filter)
      .populate("vehicleId", "vehicleNo name")
      .populate("recordedBy", "name")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VehicleMaintenance.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { records, total, page: Number(page) }, "Fetched"));
});

export const updateMaintenance = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const record = await VehicleMaintenance.findOne({ _id: req.params.id, schoolId });
  if (!record) throw new ApiError(404, "Maintenance record not found");

  const fields = ["serviceType", "scheduledDate", "completedDate", "estimatedCost", "actualCost", "status", "notes"];
  fields.forEach((f) => { if (req.body[f] !== undefined) record[f] = req.body[f]; });
  if (req.body.status === "Completed" && !record.completedDate) {
    record.completedDate = new Date();
  }
  await record.save();

  res.json(new ApiResponse(200, record, "Updated"));
});

export const deleteMaintenance = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const record = await VehicleMaintenance.findOne({ _id: req.params.id, schoolId });
  if (!record) throw new ApiError(404, "Maintenance record not found");
  await record.deleteOne();
  res.json(new ApiResponse(200, null, "Deleted"));
});

export const getMaintenanceStats = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [completed, scheduled, totalCost] = await Promise.all([
    VehicleMaintenance.countDocuments({ schoolId, status: "Completed", completedDate: { $gte: monthStart } }),
    VehicleMaintenance.countDocuments({ schoolId, status: "Scheduled" }),
    VehicleMaintenance.aggregate([
      { $match: { schoolId, completedDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$actualCost" } } },
    ]),
  ]);

  res.json(new ApiResponse(200, {
    completedThisMonth: completed,
    scheduled,
    totalCostThisMonth: totalCost[0]?.total || 0,
  }, "Stats fetched"));
});
