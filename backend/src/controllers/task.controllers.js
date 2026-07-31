import mongoose from "mongoose";
import { Task } from "../models/Task.model.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { resolveSchoolId as getSchoolId } from "../utils/resolveSchoolId.js";

const getRoleName = (user) => user?.roleId?.name || user?.role?.name || user?.role || "";

/* ── Create task (School Admin only) ── */
export const createTask = asyncHandler(async (req, res) => {
  const roleName = getRoleName(req.user);
  if (roleName !== "School Admin") throw new ApiError(403, "Only School Admin can create tasks");

  const { title, description, priority, dueDate, assignedTo } = req.body;
  if (!title?.trim()) throw new ApiError(400, "Title is required");

  const schoolId = getSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School not found for this user");

  const assignees = Array.isArray(assignedTo) ? assignedTo.filter(Boolean) : [];

  const assigneeStatus = assignees.map((userId) => ({ userId, status: "todo" }));

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim() || "",
    priority: priority || "medium",
    dueDate: dueDate ? new Date(dueDate) : null,
    assignedTo: assignees,
    assignedBy: req.user._id,
    schoolId,
    assigneeStatus,
  });

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email avatar")
    .populate("assignedBy", "name email");

  return sendSuccess(res, { statusCode: 201, message: "Task created", data: populated });
});

/* ── List tasks (School Admin sees all; others see their own) ── */
export const listTasks = asyncHandler(async (req, res) => {
  const roleName = getRoleName(req.user);
  const schoolId = getSchoolId(req.user);
  const userId = req.user._id;

  const { status, priority, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { schoolId };

  if (roleName !== "School Admin") {
    filter.assignedTo = userId;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("assignedTo", "name email avatar")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Task.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: tasks,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
});

/* ── Get single task ── */
export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("assignedTo", "name email avatar")
    .populate("assignedBy", "name email");

  if (!task) throw new ApiError(404, "Task not found");

  const schoolId = getSchoolId(req.user);
  if (task.schoolId.toString() !== schoolId?.toString())
    throw new ApiError(403, "Access denied");

  return sendSuccess(res, { data: task });
});

/* ── Update task (School Admin full edit; assignee status update only) ── */
export const updateTask = asyncHandler(async (req, res) => {
  const roleName = getRoleName(req.user);
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const schoolId = getSchoolId(req.user);
  if (task.schoolId.toString() !== schoolId?.toString())
    throw new ApiError(403, "Access denied");

  if (roleName === "School Admin") {
    const { title, description, priority, dueDate, assignedTo, status } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (Array.isArray(assignedTo)) {
      task.assignedTo = assignedTo.filter(Boolean);
      // Sync assigneeStatus: keep existing, add new
      const existing = new Map(task.assigneeStatus.map((a) => [a.userId.toString(), a]));
      task.assigneeStatus = task.assignedTo.map((uid) => {
        const key = uid.toString();
        return existing.get(key) || { userId: uid, status: "todo", updatedAt: new Date() };
      });
    }
  } else {
    // Non-admin: can only update their own assigneeStatus
    const { myStatus } = req.body;
    if (!myStatus) throw new ApiError(400, "myStatus is required");

    const idx = task.assigneeStatus.findIndex(
      (a) => a.userId.toString() === req.user._id.toString()
    );
    if (idx === -1) throw new ApiError(403, "You are not assigned to this task");

    task.assigneeStatus[idx].status = myStatus;
    task.assigneeStatus[idx].updatedAt = new Date();

    // Roll up overall status
    const statuses = task.assigneeStatus.map((a) => a.status);
    if (statuses.every((s) => s === "done")) task.status = "done";
    else if (statuses.some((s) => s === "in_progress" || s === "done")) task.status = "in_progress";
    else task.status = "todo";
  }

  await task.save();

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email avatar")
    .populate("assignedBy", "name email");

  return sendSuccess(res, { data: populated, message: "Task updated" });
});

/* ── Delete task (School Admin only) ── */
export const deleteTask = asyncHandler(async (req, res) => {
  const roleName = getRoleName(req.user);
  if (roleName !== "School Admin") throw new ApiError(403, "Only School Admin can delete tasks");

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const schoolId = getSchoolId(req.user);
  if (task.schoolId.toString() !== schoolId?.toString())
    throw new ApiError(403, "Access denied");

  await task.deleteOne();
  return sendSuccess(res, { message: "Task deleted" });
});

/* ── Get assignable users (School Admin) ── */
export const getAssignableUsers = asyncHandler(async (req, res) => {
  const roleName = getRoleName(req.user);
  if (roleName !== "School Admin") throw new ApiError(403, "Forbidden");

  const schoolId = getSchoolId(req.user);

  // Tasks are staff work items — Students/Parents were never meant to be assignable, but with no
  // role filter at all this returned literally every active user in the school (the entire
  // family+student body alongside staff), which is both wrong for the dropdown and unbounded at
  // scale. Excluding those two roles, plus a generous cap, addresses both.
  const excludedRoles = await Role.find({
    name: { $in: [/^student$/i, /^parent$/i] },
  }).select("_id");

  const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 2000);

  const users = await User.find({
    schoolId,
    isActive: true,
    roleId: { $nin: excludedRoles.map((r) => r._id) },
  })
    .populate("roleId", "name")
    .select("name email avatar roleId")
    .sort({ name: 1 })
    .limit(limit)
    .lean();

  const formatted = users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.roleId?.name || "",
  }));

  return sendSuccess(res, { data: formatted });
});
