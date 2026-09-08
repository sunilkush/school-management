import mongoose from "mongoose";

import { AcademicYear } from "../models/AcademicYear.model.js";
import { Circular } from "../models/Circular.model.js";
import { CircularAcknowledgement } from "../models/CircularAcknowledgement.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  acknowledgementStatus,
  nextCircularNumber,
  pendingAcknowledgements,
  resolveRecipients,
} from "../services/circular.service.js";

/**
 * Circulars: the school's numbered notices, and the record of who has read them.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const parseDate = (value, label) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return d;
};

const objectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(400, `Invalid ${label}`);
  return value;
};

/* ══ Issuing ══════════════════════════════════════════════════════ */

export const listCirculars = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { status, category, search, academicYearId } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { circularNumber: rx }, { body: rx }];
  }

  const circulars = await Circular.find(filter)
    .select("-recipients")
    .populate("issuedBy", "name")
    .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
    .limit(300)
    .lean();

  // The acknowledgement figure is the reason to open this list at all when a circular is mandatory.
  const withStatus = await Promise.all(
    circulars.map(async (c) => ({
      ...c,
      ack: c.requiresAcknowledgement ? await acknowledgementStatus({ schoolId, circularId: c._id }) : null,
    }))
  );

  return res.json(new ApiResponse(200, withStatus, "Circulars fetched"));
});

export const createCircular = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { title, body, category, attachments, audience, requiresAcknowledgement, acknowledgementDeadline, acknowledgementText, academicYearId, supersedesId } = req.body;

  if (!title?.trim()) throw new ApiError(400, "A title is required");
  if (!body?.trim()) throw new ApiError(400, "The circular needs a body");

  const circular = await Circular.create({
    schoolId,
    academicYearId: academicYearId || null,
    title: title.trim(),
    body: body.trim(),
    category: category || "General",
    attachments: Array.isArray(attachments) ? attachments : [],
    audience: {
      roles: audience?.roles || [],
      schoolClassIds: audience?.schoolClassIds || [],
      sectionIds: audience?.sectionIds || [],
      userIds: audience?.userIds || [],
    },
    requiresAcknowledgement: Boolean(requiresAcknowledgement),
    acknowledgementDeadline: parseDate(acknowledgementDeadline, "acknowledgement deadline"),
    ...(acknowledgementText ? { acknowledgementText } : {}),
    supersedesId: supersedesId || null,
    status: "draft",
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, circular, "Circular saved as a draft"));
});

export const updateCircular = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const circular = await Circular.findOne({ _id: objectId(req.params.id, "circular id"), schoolId });
  if (!circular) throw new ApiError(404, "Circular not found");

  // The model refuses edits to a published circular; this is the friendlier version of the same
  // rule, said before the work is thrown away.
  if (circular.status === "published") {
    throw new ApiError(400, "A published circular cannot be edited — issue a new one that supersedes it");
  }

  const fields = ["title", "body", "category", "attachments", "audience", "requiresAcknowledgement", "acknowledgementText", "isPinned"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) circular[field] = req.body[field];
  });
  if (req.body.acknowledgementDeadline !== undefined) {
    circular.acknowledgementDeadline = parseDate(req.body.acknowledgementDeadline, "acknowledgement deadline");
  }

  await circular.save();
  return res.json(new ApiResponse(200, circular, "Circular updated"));
});

/**
 * Publishes it: assigns the number and freezes the recipient list.
 *
 * The recipients are worked out once, here, and stored. Doing it live on every read would mean a
 * child who joins in November silently appears as "has not acknowledged" a circular from August,
 * and every compliance figure the school has already quoted would move underneath it.
 */
export const publishCircular = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const circular = await Circular.findOne({ _id: objectId(req.params.id, "circular id"), schoolId });
  if (!circular) throw new ApiError(404, "Circular not found");
  if (circular.status === "published") throw new ApiError(400, "This circular is already published");
  if (circular.status === "archived") throw new ApiError(400, "An archived circular cannot be published");

  const year = circular.academicYearId
    ? await AcademicYear.findById(circular.academicYearId).select("name").lean()
    : await AcademicYear.findOne({ schoolId, isActive: true }).select("name _id").lean();

  const recipients = await resolveRecipients({
    schoolId,
    audience: circular.audience,
    academicYearId: circular.academicYearId || year?._id || null,
  });

  if (!recipients.length) {
    // Publishing to nobody is almost always a mis-set audience, and silently succeeding would
    // leave the school believing a notice went out.
    throw new ApiError(400, "That audience matches nobody — check the roles and classes selected");
  }

  circular.circularNumber = await nextCircularNumber({
    schoolId,
    academicYearId: circular.academicYearId,
    yearLabel: year?.name,
  });
  circular.recipients = recipients;
  circular.recipientCount = recipients.length;
  circular.status = "published";
  circular.publishedAt = new Date();
  circular.issuedBy = req.user._id;
  await circular.save();

  // Link both ways, so the superseded one can say so on its own page.
  if (circular.supersedesId) {
    await Circular.updateOne({ _id: circular.supersedesId, schoolId }, { $set: { supersededById: circular._id } });
  }

  return res.json(
    new ApiResponse(200, circular, `Published as ${circular.circularNumber} to ${recipients.length} recipient(s)`)
  );
});

export const archiveCircular = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const circular = await Circular.findOne({ _id: objectId(req.params.id, "circular id"), schoolId });
  if (!circular) throw new ApiError(404, "Circular not found");

  circular.status = "archived";
  circular.archivedAt = new Date();
  await circular.save();

  // Archived, never deleted: it was issued, people acknowledged it, and that stays on the record.
  return res.json(new ApiResponse(200, circular, "Circular archived"));
});

export const deleteCircular = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const circular = await Circular.findOne({ _id: objectId(req.params.id, "circular id"), schoolId });
  if (!circular) throw new ApiError(404, "Circular not found");
  if (circular.status !== "draft") {
    throw new ApiError(400, "Only a draft can be deleted — archive a published circular instead");
  }

  await circular.deleteOne();
  return res.json(new ApiResponse(200, null, "Draft deleted"));
});

/* ══ Reading ══════════════════════════════════════════════════════ */

/** The circulars addressed to the person asking. */
export const myCirculars = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);

  const circulars = await Circular.find({
    schoolId,
    status: "published",
    recipients: req.user._id,
  })
    .select("-recipients")
    .populate("issuedBy", "name")
    .sort({ isPinned: -1, publishedAt: -1 })
    .limit(200)
    .lean();

  const rows = await CircularAcknowledgement.find({
    circularId: { $in: circulars.map((c) => c._id) },
    userId: req.user._id,
  }).lean();
  const byCircular = new Map(rows.map((r) => [String(r.circularId), r]));

  const data = circulars.map((c) => {
    const row = byCircular.get(String(c._id));
    return {
      ...c,
      viewedAt: row?.viewedAt || null,
      acknowledgedAt: row?.acknowledgedAt || null,
      // The one thing this list exists to surface: what still needs the reader to act.
      needsAcknowledgement: Boolean(c.requiresAcknowledgement && !row?.acknowledgedAt),
    };
  });

  return res.json(
    new ApiResponse(200, data, `${data.filter((c) => c.needsAcknowledgement).length} circular(s) need your acknowledgement`)
  );
});

/**
 * Opening a circular. Records the view, which is not the same as agreeing to it.
 */
export const readCircular = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const circular = await Circular.findOne({ _id: objectId(req.params.id, "circular id"), schoolId }).lean();
  if (!circular) throw new ApiError(404, "Circular not found");

  const isRecipient = (circular.recipients || []).some((id) => String(id) === String(req.user._id));
  const isStaff = Boolean(req.userRole?.name);

  if (circular.status !== "published" && !isStaff) throw new ApiError(404, "Circular not found");
  if (!isRecipient && !isStaff) throw new ApiError(403, "This circular was not addressed to you");

  let mine = null;
  if (isRecipient) {
    mine = await CircularAcknowledgement.findOneAndUpdate(
      { circularId: circular._id, userId: req.user._id },
      { $setOnInsert: { schoolId, viewedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  }

  const { recipients, ...rest } = circular;
  // The reader's own state travels with the circular, so the page knows whether to offer the
  // acknowledgement button without a second request that could disagree with this one.
  return res.json(
    new ApiResponse(
      200,
      { ...rest, viewedAt: mine?.viewedAt || null, acknowledgedAt: mine?.acknowledgedAt || null },
      "Circular"
    )
  );
});

/**
 * Acknowledging it. A separate, deliberate act — and the wording agreed to is copied onto the
 * record rather than pointed at, so it cannot change afterwards.
 */
export const acknowledgeCircular = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const circular = await Circular.findOne({ _id: objectId(req.params.id, "circular id"), schoolId }).lean();
  if (!circular) throw new ApiError(404, "Circular not found");
  if (circular.status !== "published") throw new ApiError(400, "That circular is not published");
  if (!circular.requiresAcknowledgement) throw new ApiError(400, "This circular does not ask for an acknowledgement");

  const isRecipient = (circular.recipients || []).some((id) => String(id) === String(req.user._id));
  if (!isRecipient) throw new ApiError(403, "This circular was not addressed to you");

  const existing = await CircularAcknowledgement.findOne({ circularId: circular._id, userId: req.user._id });
  if (existing?.acknowledgedAt) {
    return res.json(new ApiResponse(200, existing, "Already acknowledged"));
  }

  const row = await CircularAcknowledgement.findOneAndUpdate(
    { circularId: circular._id, userId: req.user._id },
    {
      $set: {
        schoolId,
        acknowledgedAt: new Date(),
        acknowledgementText: circular.acknowledgementText,
        note: req.body.note || "",
        ...(req.body.onBehalfOfStudentId ? { onBehalfOfStudentId: req.body.onBehalfOfStudentId } : {}),
      },
      $setOnInsert: { viewedAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json(new ApiResponse(200, row, "Acknowledged"));
});

/* ══ Compliance ═══════════════════════════════════════════════════ */

export const getAcknowledgementStatus = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const data = await acknowledgementStatus({ schoolId, circularId: objectId(req.params.id, "circular id") });
  if (!data) throw new ApiError(404, "Circular not found");
  return res.json(new ApiResponse(200, data, "Acknowledgement status"));
});

export const getPending = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const rows = await pendingAcknowledgements({ schoolId, circularId: objectId(req.params.id, "circular id") });

  return res.json(
    new ApiResponse(200, rows, rows.length ? `${rows.length} still to acknowledge` : "Everybody has acknowledged")
  );
});

export const getAcknowledgements = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const rows = await CircularAcknowledgement.find({
    schoolId,
    circularId: objectId(req.params.id, "circular id"),
    acknowledgedAt: { $ne: null },
  })
    .populate("userId", "name email")
    .sort({ acknowledgedAt: -1 })
    .limit(1000)
    .lean();

  return res.json(new ApiResponse(200, rows, `${rows.length} acknowledgement(s)`));
});
