import mongoose from "mongoose";
import { AMCTracking } from "../models/AMCTracking.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;

const ensureSchool = (schoolId) => {
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId))
    throw new ApiError(400, "Valid schoolId is required");
  return schoolId;
};

const computeStatus = (startDate, endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const start = new Date(startDate);
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  if (now < start) return "upcoming";
  if (now > end)   return "expired";
  if (end - now <= thirtyDays) return "expiring_soon";
  return "active";
};

export const getAMCs = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { status, assetId, vendorId } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (assetId) filter.assetId = assetId;
  if (vendorId) filter.vendorId = vendorId;

  const amcs = await AMCTracking.find(filter)
    .populate("assetId", "name serialNumber")
    .populate("vendorId", "name phone")
    .sort({ endDate: 1 })
    .lean();

  const enriched = amcs.map((a) => ({
    ...a,
    computedStatus: computeStatus(a.startDate, a.endDate),
    daysRemaining: Math.max(0, Math.ceil((new Date(a.endDate) - new Date()) / (1000 * 60 * 60 * 24))),
  }));

  return res.status(200).json(new ApiResponse(200, enriched, "AMCs fetched"));
});

export const createAMC = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const {
    assetId, assetName, vendorId, contractNumber,
    serviceType, startDate, endDate, cost, nextServiceDate, notes,
  } = req.body;

  if (!assetId || !assetName || !startDate || !endDate)
    throw new ApiError(400, "assetId, assetName, startDate and endDate are required");

  if (new Date(endDate) <= new Date(startDate))
    throw new ApiError(400, "endDate must be after startDate");

  const amc = await AMCTracking.create({
    schoolId,
    assetId, assetName,
    vendorId: vendorId || null,
    contractNumber, serviceType: serviceType || "comprehensive",
    startDate, endDate, cost: cost || 0,
    nextServiceDate: nextServiceDate || null,
    status: computeStatus(startDate, endDate),
    notes,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, amc, "AMC contract created"));
});

export const updateAMC = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const amc = await AMCTracking.findOne({ _id: id, schoolId });
  if (!amc) throw new ApiError(404, "AMC not found");

  const allowed = ["assetName", "vendorId", "contractNumber", "serviceType", "startDate", "endDate", "cost", "nextServiceDate", "notes"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) amc[f] = req.body[f]; });

  amc.status = computeStatus(amc.startDate, amc.endDate);
  await amc.save();

  return res.status(200).json(new ApiResponse(200, amc, "AMC updated"));
});

export const addServiceLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { date, description, technician, cost } = req.body;

  if (!date || !description) throw new ApiError(400, "date and description are required");

  const amc = await AMCTracking.findOne({ _id: id, schoolId });
  if (!amc) throw new ApiError(404, "AMC not found");

  amc.serviceLogs.push({ date, description, technician, cost: cost || 0 });
  await amc.save();

  return res.status(200).json(new ApiResponse(200, amc, "Service log added"));
});

export const deleteAMC = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const amc = await AMCTracking.findOneAndDelete({ _id: id, schoolId });
  if (!amc) throw new ApiError(404, "AMC not found");

  return res.status(200).json(new ApiResponse(200, null, "AMC deleted"));
});
