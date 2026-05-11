import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const ALL_MESSAGE_ROLES = [
  "Super Admin",
  "School Admin",
  "Principal",
  "Vice Principal",
  "Teacher",
  "Student",
  "Parent",
  "Accountant",
  "Receptionist",
  "Librarian",
  "Staff",
  "Support Staff",
  "Subject Coordinator",
  "Hostel Warden",
  "Transport Manager",
  "Exam Coordinator",
  "IT Support",
  "Counselor",
  "Security",
];

const MESSAGE_POPULATE = [
  { path: "senderId", select: "name email roleId schoolId", populate: { path: "roleId", select: "name" } },
  { path: "recipientIds", select: "name email roleId schoolId", populate: { path: "roleId", select: "name" } },
];

const getRoleName = (user) => user?.roleId?.name || user?.role?.name || "";
const getSchoolId = (user) => user?.schoolId?._id || user?.schoolId || null;
const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));
const uniqueIds = (values = []) => [...new Set(values.map((value) => String(value)).filter(Boolean))];

const assertCanUseMessages = (user) => {
  const roleName = getRoleName(user);
  if (!ALL_MESSAGE_ROLES.includes(roleName)) {
    throw new ApiError(403, "Forbidden. Message module is not enabled for your role.");
  }
};

const buildRecipientScope = (req) => {
  const roleName = getRoleName(req.user);
  const schoolId = getSchoolId(req.user);
  const base = { isActive: true, isDeleted: { $ne: true } };

  if (roleName === "Super Admin") return base;

  return {
    ...base,
    $or: [{ schoolId }, { schoolId: null }],
  };
};

const buildMessageScope = (req) => {
  const roleName = getRoleName(req.user);
  const schoolId = getSchoolId(req.user);
  const participantFilter = {
    $or: [{ senderId: req.user._id }, { recipientIds: req.user._id }],
  };

  if (roleName === "Super Admin") return participantFilter;

  return {
    $and: [participantFilter, { $or: [{ schoolId }, { schoolId: null }] }],
  };
};

const mapMessage = (message, userId) => {
  const id = String(userId);
  const readBy = (message.readBy || []).map(String);
  const archivedBy = (message.archivedBy || []).map(String);
  const deletedBy = (message.deletedBy || []).map(String);
  const senderId = message.senderId?._id || message.senderId;

  return {
    ...message,
    isRead: readBy.includes(id) || String(senderId) === id,
    isArchived: archivedBy.includes(id),
    isDeleted: deletedBy.includes(id),
  };
};

const getAccessibleMessage = async (req, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid message id");

  const message = await Message.findOne({ _id: id, ...buildMessageScope(req) }).populate(MESSAGE_POPULATE).lean();
  if (!message) throw new ApiError(404, "Message not found");
  return message;
};

export const listMessageRecipients = asyncHandler(async (req, res) => {
  assertCanUseMessages(req.user);

  const users = await User.find({ ...buildRecipientScope(req), _id: { $ne: req.user._id } })
    .select("name email roleId schoolId")
    .populate("roleId", "name")
    .sort({ name: 1 })
    .lean();

  return sendSuccess(res, {
    message: "Message recipients fetched successfully",
    data: users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId?.name || "User",
      schoolId: user.schoolId,
    })),
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  assertCanUseMessages(req.user);

  const { mailbox = "inbox", search = "" } = req.query;
  const userId = req.user._id;
  const baseScope = buildMessageScope(req);
  const filters = [{ ...baseScope, deletedBy: { $ne: userId } }];

  if (mailbox === "sent") filters.push({ senderId: userId });
  else if (mailbox === "archive") filters.push({ archivedBy: userId });
  else filters.push({ recipientIds: userId, archivedBy: { $ne: userId } });

  const query = search.trim();
  if (query) {
    filters.push({
      $or: [
        { subject: { $regex: query, $options: "i" } },
        { body: { $regex: query, $options: "i" } },
      ],
    });
  }

  const rows = await Message.find({ $and: filters }).populate(MESSAGE_POPULATE).sort({ createdAt: -1 }).lean();

  return sendSuccess(res, {
    message: "Messages fetched successfully",
    data: rows.map((row) => mapMessage(row, userId)),
  });
});

export const getMessageThread = asyncHandler(async (req, res) => {
  assertCanUseMessages(req.user);

  const root = await getAccessibleMessage(req, req.params.id);
  const threadId = root.threadId || root._id;
  const rows = await Message.find({ threadId, ...buildMessageScope(req), deletedBy: { $ne: req.user._id } })
    .populate(MESSAGE_POPULATE)
    .sort({ createdAt: 1 })
    .lean();

  return sendSuccess(res, {
    message: "Message thread fetched successfully",
    data: rows.map((row) => mapMessage(row, req.user._id)),
  });
});

export const createMessage = asyncHandler(async (req, res) => {
  assertCanUseMessages(req.user);

  const { subject, body, recipientIds = [], priority = "normal", parentMessageId = null } = req.body || {};
  if (!subject?.trim()) throw new ApiError(400, "Subject is required");
  if (!body?.trim()) throw new ApiError(400, "Message body is required");
  if (!["low", "normal", "high", "urgent"].includes(priority)) throw new ApiError(400, "Invalid priority");

  const recipients = uniqueIds(recipientIds).filter((id) => mongoose.Types.ObjectId.isValid(id) && id !== String(req.user._id));
  if (!recipients.length) throw new ApiError(400, "At least one valid recipient is required");

  const allowedRecipientDocs = await User.find({ ...buildRecipientScope(req), _id: { $in: recipients.map(toObjectId) } })
    .select("_id")
    .lean();
  if (allowedRecipientDocs.length !== recipients.length) {
    throw new ApiError(403, "One or more recipients are not available for messaging.");
  }

  let parent = null;
  if (parentMessageId) parent = await getAccessibleMessage(req, parentMessageId);

  const created = await Message.create({
    subject: subject.trim(),
    body: body.trim(),
    priority,
    senderId: req.user._id,
    recipientIds: recipients.map(toObjectId),
    schoolId: getSchoolId(req.user),
    parentMessageId: parent?._id || null,
    threadId: parent?.threadId || parent?._id || null,
    readBy: [req.user._id],
  });

  if (!created.threadId) {
    created.threadId = created._id;
    await created.save({ validateBeforeSave: false });
  }

  const populated = await Message.findById(created._id).populate(MESSAGE_POPULATE).lean();

  return sendSuccess(res, {
    statusCode: 201,
    message: "Message sent successfully",
    data: mapMessage(populated, req.user._id),
  });
});

export const markMessageRead = asyncHandler(async (req, res) => {
  assertCanUseMessages(req.user);
  await getAccessibleMessage(req, req.params.id);

  const updated = await Message.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { readBy: req.user._id } },
    { new: true }
  )
    .populate(MESSAGE_POPULATE)
    .lean();

  return sendSuccess(res, {
    message: "Message marked as read",
    data: mapMessage(updated, req.user._id),
  });
});

export const archiveMessage = asyncHandler(async (req, res) => {
  assertCanUseMessages(req.user);
  await getAccessibleMessage(req, req.params.id);

  const updated = await Message.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { archivedBy: req.user._id } },
    { new: true }
  )
    .populate(MESSAGE_POPULATE)
    .lean();

  return sendSuccess(res, {
    message: "Message archived successfully",
    data: mapMessage(updated, req.user._id),
  });
});

export const deleteMessageForMe = asyncHandler(async (req, res) => {
  assertCanUseMessages(req.user);
  await getAccessibleMessage(req, req.params.id);

  await Message.findByIdAndUpdate(req.params.id, { $addToSet: { deletedBy: req.user._id } });

  return sendSuccess(res, {
    message: "Message removed from your mailbox",
    data: { id: req.params.id },
  });
});
