import { TempAccess } from "../models/TempAccess.model.js";
import { User } from "../models/user.model.js";
import { Role} from "../models/Roles.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTempAccess = asyncHandler(async (req, res) => {
  const { userId, roleId, scope, reason, validTill } = req.body;

  if (!userId || !roleId || !reason || !validTill) {
    throw new ApiError(400, "userId, roleId, reason, and validTill are required");
  }

  const [userExists, roleExists] = await Promise.all([
    User.findById(userId).select("_id name email"),
    Role.findById(roleId).select("_id name"),
  ]);

  if (!userExists) throw new ApiError(404, "User not found");
  if (!roleExists) throw new ApiError(404, "Role not found");

  const record = await TempAccess.create({
    userId,
    roleId,
    grantedBy: req.user._id,
    scope: scope || "global",
    reason,
    validTill: new Date(validTill),
  });

  const populated = await TempAccess.findById(record._id)
    .populate("userId", "name email")
    .populate("roleId", "name")
    .populate("grantedBy", "name email");

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Temporary access granted"));
});

export const listTempAccess = asyncHandler(async (req, res) => {
  // Auto-expire stale records
  await TempAccess.updateMany(
    { status: "Active", validTill: { $lt: new Date() } },
    { $set: { status: "Expired" } }
  );

  const records = await TempAccess.find()
    .populate("userId", "name email")
    .populate("roleId", "name")
    .populate("grantedBy", "name email")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, records, "Temporary access records fetched"));
});

export const revokeTempAccess = asyncHandler(async (req, res) => {
  const record = await TempAccess.findById(req.params.id);
  if (!record) throw new ApiError(404, "Record not found");
  if (record.status !== "Active") throw new ApiError(400, "Record is not active");

  record.status = "Revoked";
  await record.save();

  return res
    .status(200)
    .json(new ApiResponse(200, record, "Temporary access revoked"));
});

export const deleteTempAccess = asyncHandler(async (req, res) => {
  const record = await TempAccess.findByIdAndDelete(req.params.id);
  if (!record) throw new ApiError(404, "Record not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Temporary access record deleted"));
});
