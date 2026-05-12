import mongoose from "mongoose";
import {
  SCHOOL_EVENT_AUDIENCES,
  SCHOOL_EVENT_STATUSES,
  SCHOOL_EVENT_TYPES,
  SchoolEvent,
} from "../models/SchoolEvent.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const ADMIN_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal"];

const getRoleName = (user) => user?.roleId?.name || user?.role?.name || user?.role || "";
const getSchoolId = (user) => user?.schoolId?._id || user?.schoolId;

const requireSchoolScope = (req) => {
  const schoolId = getSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context is required for events");
  return schoolId;
};

const requireManageAccess = (req) => {
  const roleName = getRoleName(req.user);
  if (!ADMIN_ROLES.includes(roleName)) {
    throw new ApiError(403, "Forbidden. You are not allowed to manage school events.");
  }
};

const parseDate = (value, fieldName) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new ApiError(400, `${fieldName} is required and must be a valid date`);
  return date;
};

const normalizeEventPayload = (body = {}, existing = null) => {
  const title = String(body.title ?? body.name ?? existing?.title ?? "").trim();
  if (!title) throw new ApiError(400, "Event title is required");

  const startDate = parseDate(body.startDate ?? body.date ?? existing?.startDate, "startDate");
  const endDate = parseDate(body.endDate ?? body.startDate ?? body.date ?? existing?.endDate ?? startDate, "endDate");
  if (startDate > endDate) throw new ApiError(400, "Event end date must be same as or after start date");

  const type = body.type ?? existing?.type ?? "Event";
  if (!SCHOOL_EVENT_TYPES.includes(type)) throw new ApiError(400, "Invalid event type");

  const audience = body.audience ?? existing?.audience ?? "All";
  if (!SCHOOL_EVENT_AUDIENCES.includes(audience)) throw new ApiError(400, "Invalid event audience");

  const status = body.status ?? existing?.status ?? "scheduled";
  if (!SCHOOL_EVENT_STATUSES.includes(status)) throw new ApiError(400, "Invalid event status");

  return {
    title,
    type,
    description: String(body.description ?? existing?.description ?? "").trim(),
    location: String(body.location ?? existing?.location ?? "").trim(),
    audience,
    startDate,
    endDate,
    allDay: body.allDay ?? existing?.allDay ?? true,
    color: String(body.color ?? existing?.color ?? "#1677ff").trim() || "#1677ff",
    status,
  };
};

const buildListFilter = (req) => {
  const schoolId = requireSchoolScope(req);
  const filter = { schoolId };
  const { from, to, type, status, q } = req.query || {};

  if (type && SCHOOL_EVENT_TYPES.includes(type)) filter.type = type;
  if (status && SCHOOL_EVENT_STATUSES.includes(status)) filter.status = status;

  if (from || to) {
    const rangeStart = from ? parseDate(from, "from") : new Date("1970-01-01T00:00:00.000Z");
    const rangeEnd = to ? parseDate(to, "to") : new Date("2999-12-31T23:59:59.999Z");
    filter.startDate = { $lte: rangeEnd };
    filter.endDate = { $gte: rangeStart };
  }

  if (q?.trim()) {
    const query = q.trim();
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
    ];
  }

  return filter;
};

export const listSchoolEvents = asyncHandler(async (req, res) => {
  const events = await SchoolEvent.find(buildListFilter(req)).sort({ startDate: 1, createdAt: -1 }).lean();

  return sendSuccess(res, {
    message: "School events fetched successfully",
    data: events,
  });
});

export const getSchoolEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid event id");

  const event = await SchoolEvent.findOne({ _id: id, schoolId: requireSchoolScope(req) }).lean();
  if (!event) throw new ApiError(404, "School event not found");

  return sendSuccess(res, {
    message: "School event fetched successfully",
    data: event,
  });
});

export const createSchoolEvent = asyncHandler(async (req, res) => {
  requireManageAccess(req);
  const event = await SchoolEvent.create({
    ...normalizeEventPayload(req.body),
    schoolId: requireSchoolScope(req),
    createdBy: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "School event created successfully",
    data: event,
  });
});

export const updateSchoolEvent = asyncHandler(async (req, res) => {
  requireManageAccess(req);
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid event id");

  const existing = await SchoolEvent.findOne({ _id: id, schoolId: requireSchoolScope(req) });
  if (!existing) throw new ApiError(404, "School event not found");

  Object.assign(existing, normalizeEventPayload(req.body, existing), { updatedBy: req.user._id });
  await existing.save();

  return sendSuccess(res, {
    message: "School event updated successfully",
    data: existing,
  });
});

export const deleteSchoolEvent = asyncHandler(async (req, res) => {
  requireManageAccess(req);
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid event id");

  const deleted = await SchoolEvent.findOneAndDelete({ _id: id, schoolId: requireSchoolScope(req) });
  if (!deleted) throw new ApiError(404, "School event not found");

  return sendSuccess(res, {
    message: "School event deleted successfully",
    data: { id },
  });
});

export const schoolEventStats = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolScope(req);
  const now = new Date();
  const [total, upcoming, past, cancelled, byType] = await Promise.all([
    SchoolEvent.countDocuments({ schoolId }),
    SchoolEvent.countDocuments({ schoolId, startDate: { $gte: now }, status: { $ne: "cancelled" } }),
    SchoolEvent.countDocuments({ schoolId, endDate: { $lt: now } }),
    SchoolEvent.countDocuments({ schoolId, status: "cancelled" }),
    SchoolEvent.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(String(schoolId)) } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return sendSuccess(res, {
    message: "School event statistics fetched successfully",
    data: { total, upcoming, past, cancelled, byType },
  });
});
