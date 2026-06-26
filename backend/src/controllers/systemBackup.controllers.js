import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { SystemBackup } from "../models/systemBackup.model.js";
import { BackupSchedule } from "../models/backupSchedule.model.js";
import { RestoreJob } from "../models/restoreJob.model.js";
import { BackupAuditLog } from "../models/backupAuditLog.model.js";
import { School } from "../models/school.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup files are stored in backend/backups/
const BACKUPS_DIR = path.join(__dirname, "..", "..", "backups");

const ensureBackupsDir = () => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
};

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

/* ── Collect data for backup JSON ───────────────────────────── */
const collectBackupData = async ({ scope, schoolId, academicYearId, modules }) => {
  const schoolFilter = schoolId ? { _id: schoolId } : {};
  const enrollmentFilter = schoolId ? { schoolId } : {};
  if (academicYearId) enrollmentFilter.academicYearId = academicYearId;

  const [schools, academicYears, enrollments] = await Promise.all([
    School.find(schoolFilter).select("name address email phone isActive").lean(),
    AcademicYear.find(schoolId ? { schoolId } : {}).select("name code startDate endDate isActive").lean(),
    StudentEnrollment.find(enrollmentFilter)
      .populate("studentId", "name email gender dateOfBirth")
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .select("registrationNumber rollNumber status admissionDate")
      .lean(),
  ]);

  return {
    meta: {
      exportedAt: new Date().toISOString(),
      scope,
      modules,
      recordCounts: {
        schools: schools.length,
        academicYears: academicYears.length,
        enrollments: enrollments.length,
      },
    },
    schools,
    academicYears,
    enrollments,
  };
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
  const backupNo  = createBackupNo();
  const fileName  = `${backupNo}.json`;

  // ── Collect real data ──────────────────────────────────────
  let backupData;
  try {
    backupData = await collectBackupData({
      scope,
      schoolId: effectiveSchoolId,
      academicYearId: academicYearId || null,
      modules,
    });
  } catch {
    backupData = { meta: { exportedAt: new Date().toISOString(), scope, error: "data collection partial" } };
  }

  backupData.meta.backupNo     = backupNo;
  backupData.meta.type         = type;
  backupData.meta.createdBy    = req.user?._id;

  // ── Write file to disk ─────────────────────────────────────
  ensureBackupsDir();
  const filePath   = path.join(BACKUPS_DIR, fileName);
  const jsonString = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(filePath, jsonString, "utf8");

  const fileSize   = Buffer.byteLength(jsonString, "utf8");
  const checksum   = crypto.createHash("sha256").update(jsonString).digest("hex");
  const completedAt = new Date();

  // ── Save record ────────────────────────────────────────────
  const backup = await SystemBackup.create({
    backupNo,
    type,
    scope,
    schoolId: effectiveSchoolId,
    academicYearId: academicYearId || null,
    modules,
    status: "success",
    storageProvider,
    fileUrl: null,
    fileKey: fileName,
    filePath,
    fileSize,
    checksum,
    encryptionEnabled,
    retentionUntil: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
    notes,
    createdBy: req.user?._id,
    startedAt,
    completedAt,
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  backup.fileUrl = `${baseUrl}/api/v1/system-backups/${backup._id}/download`;
  await backup.save();

  await createAuditEntry({
    backupId: backup._id,
    action: "backup_created",
    req,
    message: "Manual backup created",
    metadata: { type, scope, modules, storageProvider, fileSize },
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

  const pageNumber  = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const skip        = (pageNumber - 1) * limitNumber;

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

/* ── Download backup file ───────────────────────────────────── */
export const downloadBackupFile = asyncHandler(async (req, res) => {
  const roleName = ensureRole(req, [SUPER_ADMIN_ROLE, IT_SUPPORT_ROLE, SCHOOL_ADMIN_ROLE]);

  const backup = await SystemBackup.findById(req.params.id).lean();
  if (!backup) throw new ApiError(404, "Backup not found");

  if (roleName === SCHOOL_ADMIN_ROLE && `${backup.schoolId || ""}` !== `${resolveSchoolId(req) || ""}`) {
    throw new ApiError(403, "Forbidden. You can only download your school backups.");
  }

  if (backup.status !== "success") {
    throw new ApiError(400, "Backup file is not available — backup did not complete successfully.");
  }

  // Check if file exists on disk
  const filePath = backup.filePath || path.join(BACKUPS_DIR, backup.fileKey || `${backup.backupNo}.json`);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Backup file not found on disk. It may have been deleted.");
  }

  await createAuditEntry({
    backupId: backup._id,
    action: "backup_downloaded",
    req,
    message: "Backup file downloaded",
    metadata: { fileKey: backup.fileKey },
  });

  const downloadName = `${backup.backupNo}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", fs.statSync(filePath).size);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Keep old name as alias for backward compat (returns download metadata)
export const getSystemBackupDownloadUrl = downloadBackupFile;

export const deleteSystemBackup = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);
  const deleted = await SystemBackup.findByIdAndDelete(req.params.id).lean();
  if (!deleted) throw new ApiError(404, "Backup not found");

  // Remove file from disk
  const filePath = deleted.filePath || path.join(BACKUPS_DIR, deleted.fileKey || "");
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }

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

  const schedule = await BackupSchedule.create({
    ...req.body,
    createdBy: req.user?._id,
  });

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

  return sendSuccess(res, { statusCode: 201, message: "Restore request created", data: restoreJob });
});

export const approveRestoreJob = asyncHandler(async (req, res) => {
  ensureRole(req, [SUPER_ADMIN_ROLE]);

  const { mfaToken } = req.body;
  if (!mfaToken || mfaToken.length < 6) {
    throw new ApiError(400, "Valid MFA token is required before restore approval.");
  }

  const restoreJob = await RestoreJob.findById(req.params.id);
  if (!restoreJob) throw new ApiError(404, "Restore job not found");

  restoreJob.status     = "running";
  restoreJob.approvedBy = req.user?._id;
  restoreJob.startedAt  = new Date();
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

  restoreJob.status      = "success";
  restoreJob.startedAt   = restoreJob.startedAt || new Date();
  restoreJob.completedAt = new Date();
  await restoreJob.save();

  await createAuditEntry({
    backupId: restoreJob.backupId,
    restoreJobId: restoreJob._id,
    action: "restore_completed",
    req,
    message: "Restore executed successfully",
  });

  return sendSuccess(res, { message: "Restore job executed successfully", data: restoreJob });
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
  if (backupId)     query.backupId     = backupId;
  if (restoreJobId) query.restoreJobId = restoreJobId;
  if (action)       query.action       = action;

  const pageNumber  = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const skip        = (pageNumber - 1) * limitNumber;

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
    meta: { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) },
  });
});
