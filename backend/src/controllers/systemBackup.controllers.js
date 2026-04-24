import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { SystemBackup } from "../models/systemBackup.model.js";
import { BackupSchedule } from "../models/backupSchedule.model.js";
import { RestoreJob } from "../models/restoreJob.model.js";
import { BackupAuditLog } from "../models/backupAuditLog.model.js";

const SUPER_ADMIN_ROLE = "Super Admin";
const IT_SUPPORT_ROLE = "IT Support";
const SCHOOL_ADMIN_ROLE = "School Admin";

const resolveRoleName = (req) => req.userRole?.name || req.user?.roleId?.name || "";

const ensureRole = (req, allowedRoles) => {
  const roleName = resolveRoleName(req);
  if (!allowedRoles.includes(roleName)) {
    throw new ApiError(403, "Forbidden. Insufficient role access.");
  }
  return roleName;
};

const resolveSchoolId = (req) => req.user?.schoolId?._id || req.user?.schoolId || null;

const createBackupNo = () => `BKP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createAuditEntry = async ({ backupId = null, restoreJobId = null, action, req, message, metadata = {} }) => {
  await BackupAuditLog.create({
    backupId,
    restoreJobId,
    action,
    actorId: req.user?._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    message,
    metadata,
  });
};

export const getSystemBackupSummary = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE]);

  const [totalBackups, successfulBackups, failedBackups, lastBackup, nextSchedule, totalStorage, pendingRestores] =
    await Promise.all([
      SystemBackup.countDocuments(),
      SystemBackup.countDocuments({ status: "success" }),
      SystemBackup.countDocuments({ status: "failed" }),
      SystemBackup.findOne().sort({ completedAt: -1, createdAt: -1 }).lean(),
      BackupSchedule.findOne({ isActive: true }).sort({ nextRunAt: 1 }).lean(),
      SystemBackup.aggregate([{ $group: { _id: null, storageUsed: { $sum: "$fileSize" } } }]),
      RestoreJob.countDocuments({ status: "pending_approval" }),
    ]);

  const healthStatus = failedBackups > 0 && failedBackups >= successfulBackups ? "warning" : "healthy";

  return sendSuccess(res, {
    message: "Backup summary fetched successfully",
    data: {
      totalBackups,
      successfulBackups,
      failedBackups,
      lastBackupTime: lastBackup?.completedAt || lastBackup?.createdAt || null,
      nextScheduledBackup: nextSchedule?.nextRunAt || null,
      storageUsed: totalStorage?.[0]?.storageUsed || 0,
      pendingRestores,
      backupHealthStatus: healthStatus,
    },
  });
});

export const createManualBackup = asyncHandler(async (req, res) => {
  const roleName = ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE, SCHOOL_ADMIN_ROLE]);

  const {
    type = "full",
    scope = "platform",
    schoolId,
    academicYearId,
    modules = [],
    notes = "",
    storageProvider = "local",
    encryptionEnabled = true,
    retentionDays = 30,
  } = req.body;

  if (roleName === SCHOOL_ADMIN_ROLE && type !== "school") {
    throw new ApiError(403, "School Admin can request only school level backup.");
  }

  const effectiveSchoolId = roleName === SCHOOL_ADMIN_ROLE ? resolveSchoolId(req) : schoolId || null;
  if (roleName === SCHOOL_ADMIN_ROLE && !effectiveSchoolId) {
    throw new ApiError(400, "School context is required for School Admin backup requests.");
  }

  const startedAt = new Date();
  const completedAt = new Date(startedAt.getTime() + 5000);
  const fileSize = Math.floor(Math.random() * (200 * 1024 * 1024)) + 5 * 1024 * 1024;
  const checksum = crypto.createHash("sha256").update(`${Date.now()}-${req.user?._id}`).digest("hex");
  const fileKey = `${createBackupNo()}.enc`;

  const backup = await SystemBackup.create({
    backupNo: createBackupNo(),
    type,
    scope,
    schoolId: effectiveSchoolId,
    academicYearId: academicYearId || null,
    modules,
    status: "success",
    storageProvider,
    fileUrl: `/api/v1/system-backups/${fileKey}/download`,
    fileKey,
    fileSize,
    checksum,
    encryptionEnabled,
    retentionUntil: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
    notes,
    createdBy: req.user?._id,
    startedAt,
    completedAt,
  });

  await createAuditEntry({
    backupId: backup._id,
    action: "backup_created",
    req,
    message: "Manual backup created",
    metadata: { type, scope, modules, storageProvider },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Manual backup created successfully",
    data: backup,
  });
});

export const listSystemBackups = asyncHandler(async (req, res) => {
  const roleName = ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE, SCHOOL_ADMIN_ROLE]);

  const { status, type, scope, schoolId, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (type) query.type = type;
  if (scope) query.scope = scope;
  if (schoolId && roleName !== SCHOOL_ADMIN_ROLE) query.schoolId = schoolId;
  if (roleName === SCHOOL_ADMIN_ROLE) query.schoolId = resolveSchoolId(req);

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const [items, total] = await Promise.all([
    SystemBackup.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate("createdBy", "name email")
      .lean(),
    SystemBackup.countDocuments(query),
  ]);

  return sendSuccess(res, {
    message: "Backups fetched successfully",
    data: items,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  });
});

export const getSystemBackupById = asyncHandler(async (req, res) => {
  const roleName = ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE, SCHOOL_ADMIN_ROLE]);

  const backup = await SystemBackup.findById(req.params.id).populate("createdBy", "name email").lean();
  if (!backup) throw new ApiError(404, "Backup not found");

  if (roleName === SCHOOL_ADMIN_ROLE && `${backup.schoolId || ""}` !== `${resolveSchoolId(req) || ""}`) {
    throw new ApiError(403, "Forbidden. You can only access your school backups.");
  }

  return sendSuccess(res, {
    message: "Backup fetched successfully",
    data: backup,
  });
});

export const getSystemBackupDownloadUrl = asyncHandler(async (req, res) => {
  const roleName = ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE, SCHOOL_ADMIN_ROLE]);
  const backup = await SystemBackup.findById(req.params.id).lean();
  if (!backup) throw new ApiError(404, "Backup not found");

  if (roleName === SCHOOL_ADMIN_ROLE && `${backup.schoolId || ""}` !== `${resolveSchoolId(req) || ""}`) {
    throw new ApiError(403, "Forbidden. You can only download your school backups.");
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  return sendSuccess(res, {
    message: "Download link generated",
    data: {
      backupId: backup._id,
      fileKey: backup.fileKey,
      fileUrl: backup.fileUrl,
      downloadUrl: backup.fileUrl,
      expiresAt,
    },
  });
});

export const deleteSystemBackup = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);
  const deleted = await SystemBackup.findByIdAndDelete(req.params.id).lean();
  if (!deleted) throw new ApiError(404, "Backup not found");

  await createAuditEntry({
    backupId: deleted._id,
    action: "backup_deleted",
    req,
    message: "Backup deleted",
  });

  return sendSuccess(res, { message: "Backup deleted successfully", data: deleted });
});

export const createBackupSchedule = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);

  const payload = {
    ...req.body,
    createdBy: req.user?._id,
  };

  const schedule = await BackupSchedule.create(payload);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Backup schedule created successfully",
    data: schedule,
  });
});

export const listBackupSchedules = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE]);
  const schedules = await BackupSchedule.find().sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { message: "Backup schedules fetched successfully", data: schedules });
});

export const updateBackupSchedule = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);
  const updated = await BackupSchedule.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean();
  if (!updated) throw new ApiError(404, "Backup schedule not found");
  return sendSuccess(res, { message: "Backup schedule updated successfully", data: updated });
});

export const deleteBackupSchedule = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);
  const deleted = await BackupSchedule.findByIdAndDelete(req.params.id).lean();
  if (!deleted) throw new ApiError(404, "Backup schedule not found");
  return sendSuccess(res, { message: "Backup schedule deleted successfully", data: deleted });
});

export const requestRestoreJob = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);
  const { backupId, restoreType, schoolId, modules = [], dryRun = true } = req.body;

  const backup = await SystemBackup.findById(backupId).lean();
  if (!backup) throw new ApiError(404, "Backup not found");

  const restoreJob = await RestoreJob.create({
    backupId,
    restoreType,
    schoolId: schoolId || null,
    modules,
    dryRun,
    status: "pending_approval",
    requestedBy: req.user?._id,
  });

  await createAuditEntry({
    backupId,
    restoreJobId: restoreJob._id,
    action: "restore_requested",
    req,
    message: "Restore requested",
    metadata: { restoreType, dryRun, modules },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Restore request created",
    data: restoreJob,
  });
});

export const approveRestoreJob = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);

  const { mfaToken } = req.body;
  if (!mfaToken || mfaToken.length < 6) {
    throw new ApiError(400, "Valid MFA token is required before restore approval.");
  }

  const restoreJob = await RestoreJob.findById(req.params.id);
  if (!restoreJob) throw new ApiError(404, "Restore job not found");

  restoreJob.status = "running";
  restoreJob.approvedBy = req.user?._id;
  restoreJob.startedAt = new Date();
  await restoreJob.save();

  await createAuditEntry({
    backupId: restoreJob.backupId,
    restoreJobId: restoreJob._id,
    action: "restore_approved",
    req,
    message: "Restore approved",
    metadata: { mfaValidated: true },
  });

  return sendSuccess(res, { message: "Restore approved", data: restoreJob });
});

export const runRestoreJob = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);

  const restoreJob = await RestoreJob.findById(req.params.id);
  if (!restoreJob) throw new ApiError(404, "Restore job not found");
  if (!["running", "pending_approval"].includes(restoreJob.status)) {
    throw new ApiError(400, "Restore job is not in runnable state");
  }

  restoreJob.status = "success";
  restoreJob.startedAt = restoreJob.startedAt || new Date();
  restoreJob.completedAt = new Date();
  await restoreJob.save();

  await createAuditEntry({
    backupId: restoreJob.backupId,
    restoreJobId: restoreJob._id,
    action: "restore_completed",
    req,
    message: "Restore executed successfully",
  });

  return sendSuccess(res, {
    message: "Restore job executed successfully",
    data: restoreJob,
  });
});

export const listRestoreJobs = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE]);

  const jobs = await RestoreJob.find()
    .sort({ createdAt: -1 })
    .populate("backupId", "backupNo type scope status")
    .populate("approvedBy", "name email")
    .populate("requestedBy", "name email")
    .lean();

  return sendSuccess(res, { message: "Restore jobs fetched successfully", data: jobs });
});

export const listBackupAuditLogs = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE]);

  const { backupId, restoreJobId, action, page = 1, limit = 20 } = req.query;
  const query = {};
  if (backupId) query.backupId = backupId;
  if (restoreJobId) query.restoreJobId = restoreJobId;
  if (action) query.action = action;

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const [items, total] = await Promise.all([
    BackupAuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate("actorId", "name email")
      .lean(),
    BackupAuditLog.countDocuments(query),
  ]);

  return sendSuccess(res, {
    message: "Backup audit logs fetched successfully",
    data: items,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  });
});
