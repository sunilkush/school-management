import mongoose from "mongoose";
import { SupportTicket } from "../models/SupportTicket.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const PRIVILEGED_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "IT Support", "Support Staff"];

const isPrivileged = (roleName) => PRIVILEGED_ROLES.includes(roleName);

const canAccessTicket = (ticket, user, roleName) => {
  if (roleName === "Super Admin") return true;

  if (`${ticket.createdBy}` === `${user._id}`) return true;

  if (isPrivileged(roleName) && `${ticket.schoolId}` === `${user.schoolId}`) return true;

  return false;
};

/**
 * Who a ticket may be handed to.
 *
 * Nothing checked this: any id at all was accepted and saved, so a ticket could be assigned to
 * somebody at another school — who cannot see it, since the lists are scoped by school, but
 * whose name and email then came back to everyone viewing the ticket, which populates the
 * assignee. It could also be assigned to an id belonging to nobody, leaving a ticket that looks
 * handled and is not.
 *
 * Handing a ticket to someone is also support work rather than something the person who raised
 * it does, so only the privileged roles may set it.
 */
const resolveAssignee = async (assignedTo, ticket, roleName) => {
  if (assignedTo === undefined) return undefined; // not being changed
  if (!isPrivileged(roleName)) {
    throw new ApiError(403, "Only support staff can assign a ticket");
  }
  if (!assignedTo) return null; // cleared

  if (!mongoose.Types.ObjectId.isValid(assignedTo)) throw new ApiError(400, "Invalid assignedTo");

  const assignee = await User.findOne({
    _id: assignedTo,
    schoolId: ticket.schoolId ?? null,
    isDeleted: { $ne: true },
  })
    .select("_id")
    .lean();
  if (!assignee) {
    throw new ApiError(
      404,
      ticket.schoolId
        ? "That person is not at this school"
        : "A platform ticket can only be assigned to a platform user"
    );
  }
  return assignee._id;
};

const buildTicketQuery = (req) => {
  const roleName = req.userRole?.name;
  const { status, priority, category, schoolId } = req.query;

  const query = {};

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  if (roleName === "Super Admin") {
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
      query.schoolId = new mongoose.Types.ObjectId(schoolId);
    }
    return query;
  }

  query.schoolId = req.user.schoolId;

  if (!isPrivileged(roleName)) {
    query.createdBy = req.user._id;
  }

  return query;
};

export const createSupportTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "title and description are required");
  }

  const ticket = await SupportTicket.create({
    title,
    description,
    category,
    priority,
    schoolId: req.user.schoolId || null,
    createdBy: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Support ticket created successfully",
    data: ticket,
  });
});

export const getSupportTickets = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 1000);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const query = buildTicketQuery(req);

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(query),
  ]);

  return sendSuccess(res, {
    message: "Support tickets fetched successfully",
    data: tickets,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getSupportTicketById = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("resolvedBy", "name email")
    .populate("updates.updatedBy", "name email");

  if (!ticket) throw new ApiError(404, "Support ticket not found");

  if (!canAccessTicket(ticket, req.user, req.userRole?.name)) {
    throw new ApiError(403, "Forbidden. You cannot access this ticket");
  }

  return sendSuccess(res, { message: "Support ticket fetched successfully", data: ticket });
});

export const updateSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, "Support ticket not found");

  if (!canAccessTicket(ticket, req.user, req.userRole?.name)) {
    throw new ApiError(403, "Forbidden. You cannot update this ticket");
  }

  const { title, description, category, priority, note, assignedTo } = req.body;

  const assignee = await resolveAssignee(assignedTo, ticket, req.userRole?.name);

  if (title !== undefined) ticket.title = title;
  if (description !== undefined) ticket.description = description;
  if (category !== undefined) ticket.category = category;
  if (priority !== undefined) ticket.priority = priority;
  if (assignee !== undefined) ticket.assignedTo = assignee;

  if (note) {
    ticket.updates.push({ note, updatedBy: req.user._id });
  }

  await ticket.save();

  return sendSuccess(res, {
    message: "Support ticket updated successfully",
    data: ticket,
  });
});

export const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!status) throw new ApiError(400, "status is required");

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, "Support ticket not found");

  if (!canAccessTicket(ticket, req.user, req.userRole?.name)) {
    throw new ApiError(403, "Forbidden. You cannot update status for this ticket");
  }

  ticket.status = status;

  if (status === "Resolved") {
    ticket.resolvedBy = req.user._id;
    ticket.resolvedAt = new Date();
  }

  if (status !== "Resolved") {
    ticket.resolvedBy = null;
    ticket.resolvedAt = null;
  }

  if (note) {
    ticket.updates.push({ note, updatedBy: req.user._id });
  }

  await ticket.save();

  return sendSuccess(res, {
    message: "Support ticket status updated successfully",
    data: ticket,
  });
});

export const resolveSupportTicket = asyncHandler(async (req, res) => {
  req.body.status = "Resolved";
  return updateSupportTicketStatus(req, res);
});
