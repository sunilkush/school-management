import { IpRestriction } from "../models/IpRestriction.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) =>
  req.userRole?.name === "Super Admin" ? (req.body.schoolId || req.query.schoolId || null) : req.user.schoolId;

/* ── Create IP rule ─────────────────────────────────────────────────────── */
export const createIpRule = asyncHandler(async (req, res) => {
  const { type, ipAddress, label } = req.body;
  if (!type || !ipAddress) throw new ApiError(400, "type and ipAddress are required");
  if (!["whitelist", "blacklist"].includes(type)) throw new ApiError(400, "type must be whitelist or blacklist");

  const schoolId = resolveSchoolId(req);

  // Check for duplicate
  const existing = await IpRestriction.findOne({ schoolId: schoolId || null, type, ipAddress, isActive: true });
  if (existing) throw new ApiError(409, "This IP rule already exists");

  const rule = await IpRestriction.create({
    schoolId: schoolId || null,
    type,
    ipAddress: ipAddress.trim(),
    label: label?.trim() || "",
    createdBy: req.user._id,
    isActive: true,
  });

  res.status(201).json(new ApiResponse(201, rule, "IP rule created"));
});

/* ── List IP rules ──────────────────────────────────────────────────────── */
export const listIpRules = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? (req.query.schoolId || null) : req.user.schoolId;

  const query = isSuperAdmin && !req.query.schoolId
    ? {}
    : { schoolId: schoolId || null };

  const rules = await IpRestriction.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, rules, "IP rules fetched"));
});

/* ── Update IP rule ─────────────────────────────────────────────────────── */
export const updateIpRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? null : req.user.schoolId;

  const query = schoolId ? { _id: id, schoolId } : { _id: id };
  const rule = await IpRestriction.findOne(query);
  if (!rule) throw new ApiError(404, "IP rule not found");

  if (req.body.type !== undefined) rule.type = req.body.type;
  if (req.body.ipAddress !== undefined) rule.ipAddress = req.body.ipAddress.trim();
  if (req.body.label !== undefined) rule.label = req.body.label.trim();
  if (req.body.isActive !== undefined) rule.isActive = req.body.isActive;

  await rule.save();
  res.status(200).json(new ApiResponse(200, rule, "IP rule updated"));
});

/* ── Delete IP rule ─────────────────────────────────────────────────────── */
export const deleteIpRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? null : req.user.schoolId;

  const query = schoolId ? { _id: id, schoolId } : { _id: id };
  const rule = await IpRestriction.findOneAndDelete(query);
  if (!rule) throw new ApiError(404, "IP rule not found");

  res.status(200).json(new ApiResponse(200, null, "IP rule deleted"));
});

/* ── Toggle active state ────────────────────────────────────────────────── */
export const toggleIpRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? null : req.user.schoolId;

  const query = schoolId ? { _id: id, schoolId } : { _id: id };
  const rule = await IpRestriction.findOne(query);
  if (!rule) throw new ApiError(404, "IP rule not found");

  rule.isActive = !rule.isActive;
  await rule.save();

  res.status(200).json(new ApiResponse(200, rule, `IP rule ${rule.isActive ? "enabled" : "disabled"}`));
});
