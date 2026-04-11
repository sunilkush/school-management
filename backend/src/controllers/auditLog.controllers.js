import AuditLog from "../models/AuditLog.model.js";

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

    const auditLog = await AuditLog.create({
      actorName,
      actorEmail,
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

    const query = {};

    if (search) {
      query.$or = [
        { actorName: { $regex: search, $options: "i" } },
        { actorEmail: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
      ];
    }

    if (module) {
      query.module = module;
    }

    if (status) {
      query.status = status;
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

export const getAuditFilters = async (_req, res) => {
  try {
    const [modules, statuses] = await Promise.all([
      AuditLog.distinct("module"),
      AuditLog.distinct("status"),
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
