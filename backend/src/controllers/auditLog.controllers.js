import AuditLog from "../models/AuditLog.model.js";

const resolveRoleName = (req) => req.userRole?.name || req.user?.roleId?.name || req.user?.role?.name || req.user?.role;

const resolveSchoolId = (req) => req.user?.schoolId?._id || req.user?.schoolId || null;

const applyQueryFilters = ({ search, module, status, startDate, endDate, schoolId }) => {
  const query = {};

  if (search) {
    query.$or = [
      { actorName: { $regex: search, $options: "i" } },
      { actorEmail: { $regex: search, $options: "i" } },
      { action: { $regex: search, $options: "i" } },
      { entityType: { $regex: search, $options: "i" } },
      { entityId: { $regex: search, $options: "i" } },
    ];
  }

  if (module) {
    query.module = module;
  }

  if (status) {
    query.status = status;
  }

  if (schoolId) {
    query.schoolId = schoolId;
  }

  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      const inclusiveEndDate = new Date(endDate);
      inclusiveEndDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = inclusiveEndDate;
    }
  }

  return query;
};

const generateCsv = (rows) => {
  const headers = [
    "Actor Name",
    "Actor Email",
    "Action",
    "Module",
    "Entity Type",
    "Entity ID",
    "Status",
    "IP Address",
    "Timestamp",
  ];

  const escapeCell = (value) => {
    const sanitized = `${value ?? ""}`.replace(/"/g, '""');
    return `"${sanitized}"`;
  };

  const csvRows = rows.map((item) => [
    item.actorName,
    item.actorEmail,
    item.action,
    item.module,
    item.entityType,
    item.entityId,
    item.status,
    item.ipAddress,
    item.createdAt,
  ]);

  return [headers, ...csvRows].map((row) => row.map(escapeCell).join(",")).join("\n");
};

export const createAuditLog = async (req, res) => {
  try {
    const {
      actorName,
      actorEmail,
      action,
      module,
      entityType,
      entityId,
      status,
      ipAddress,
      userAgent,
      metadata,
    } = req.body;

    const requesterName = req.user?.name || req.user?.fullName || req.user?.email;
    const requesterEmail = req.user?.email;

    const auditLog = await AuditLog.create({
      actorName: actorName || requesterName || "Unknown User",
      actorEmail: actorEmail || requesterEmail,
      actorId: req.user?._id || null,
      schoolId: resolveSchoolId(req),
      action,
      module,
      entityType,
      entityId,
      status,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.headers["user-agent"],
      metadata,
    });

    return res.status(201).json({
      success: true,
      message: "Audit log created successfully",
      data: auditLog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create audit log",
      error: error.message,
    });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const {
      search,
      module,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const roleName = resolveRoleName(req);
    const schoolId = roleName === "Super Admin" ? req.query.schoolId : resolveSchoolId(req);

    const query = applyQueryFilters({
      search,
      module,
      status,
      startDate,
      endDate,
      schoolId,
    });

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

export const exportAuditLogs = async (req, res) => {
  try {
    const { search, module, status, startDate, endDate } = req.query;

    const roleName = resolveRoleName(req);
    const schoolId = roleName === "Super Admin" ? req.query.schoolId : resolveSchoolId(req);

    const query = applyQueryFilters({
      search,
      module,
      status,
      startDate,
      endDate,
      schoolId,
    });

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(5000).lean();
    const csv = generateCsv(logs);

    const fileName = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);

    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
      error: error.message,
    });
  }
};

export const getAuditFilters = async (req, res) => {
  try {
    const roleName = resolveRoleName(req);
    const schoolId = roleName === "Super Admin" ? req.query.schoolId : resolveSchoolId(req);

    const filterQuery = schoolId ? { schoolId } : {};

    const [modules, statuses] = await Promise.all([
      AuditLog.distinct("module", filterQuery),
      AuditLog.distinct("status", filterQuery),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        modules: modules.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        statuses: statuses.filter(Boolean),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit filters",
      error: error.message,
    });
  }
};
