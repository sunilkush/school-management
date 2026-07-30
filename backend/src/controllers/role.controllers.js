import { Role } from "../models/Roles.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { escapeRegex } from "../utils/escapeRegex.js";

// ✅ Allowed Actions
const allActions = [
  "create",
  "read",
  "update",
  "delete",
  "export",
  "approve",
  "collect",
  "return",
  "assign",
];

  // ✅ Default permissions map
  const defaultPermissions = {
    "Super Admin": [
      { module: "Schools", actions: ["create", "read", "update", "delete"] },
      { module: "Users", actions: ["create", "read", "update", "delete"] },
      { module: "Settings", actions: ["read", "update"] },
    ],
    "School Admin": [
      { module: "Users", actions: ["create", "read", "update", "delete"] },
      { module: "Students", actions: ["create", "read", "update", "delete"] },
      { module: "Teachers", actions: ["create", "read", "update", "delete"] },
      { module: "Parents", actions: ["create", "read", "update", "delete"] },
      { module: "Classes", actions: ["create", "read", "update", "delete"] },
      { module: "Subjects", actions: ["create", "read", "update", "delete"] },
      { module: "Timetable", actions: ["create", "read", "update"] },
      { module: "Exams", actions: ["create", "read", "update", "delete", "export"] },
      { module: "Settings", actions: ["read", "update"] },
      { module: "Reports", actions: ["read", "export"] },
    ],
    "Principal": [
      { module: "Users", actions: ["create", "read", "update", "delete"] },
      { module: "Students", actions: ["create", "read", "update", "delete"] },
      { module: "Teachers", actions: ["create", "read", "update", "delete"] },
      { module: "Parents", actions: ["create", "read", "update", "delete"] },
      { module: "Classes", actions: ["create", "read", "update", "delete"] },
      { module: "Subjects", actions: ["create", "read", "update", "delete"] },
      { module: "Timetable", actions: ["create", "read", "update"] },
      { module: "Exams", actions: ["create", "read", "update", "delete", "export"] },
      { module: "Settings", actions: ["read", "update"] },
      { module: "Reports", actions: ["read", "export"] },
    ],
    "Vice Principal": [
      { module: "Users", actions: ["create", "read", "update", "delete"] },
      { module: "Students", actions: ["create", "read", "update", "delete"] },
      { module: "Teachers", actions: ["create", "read", "update", "delete"] },
      { module: "Parents", actions: ["create", "read", "update", "delete"] },
      { module: "Classes", actions: ["create", "read", "update", "delete"] },
      { module: "Subjects", actions: ["create", "read", "update", "delete"] },
      { module: "Timetable", actions: ["create", "read", "update"] },
      { module: "Settings", actions: ["read", "update"] },
      { module: "Reports", actions: ["read", "export"] },
    ],
    Teacher: [
      { module: "Students", actions: ["read"] },
      { module: "Assignments", actions: ["create", "read", "update", "delete"] },
      { module: "Timetable", actions: ["read"] },
      { module: "Exams", actions: ["create", "read", "update"] },
      { module: "Attendance", actions: ["create", "read"] },
    ],
    Student: [
      { module: "Assignments", actions: ["read"] },
      { module: "Timetable", actions: ["read"] },
      { module: "Exams", actions: ["read"] },
      { module: "Reports", actions: ["read"] },
    ],
    Parent: [
      { module: "Students", actions: ["read"] },
      { module: "Exams", actions: ["read"] },
      { module: "Reports", actions: ["read"] },
      { module: "Fees", actions: ["read"] },
      { module: "Notifications", actions: ["read"] },
    ],
    Accountant: [
      { module: "Fees", actions: ["create", "read", "update", "delete", "collect"] },
      { module: "Finance", actions: ["create", "read", "update", "delete", "export"] },
      { module: "Expenses", actions: ["create", "read", "update", "delete"] },
    ],
    Staff: [
      { module: "Attendance", actions: ["create", "read"] },
      { module: "Notifications", actions: ["read"] },
    ],
    Librarian: [
      { module: "Books", actions: ["create", "read", "update", "delete"] },
      { module: "IssuedBooks", actions: ["create", "read", "return"] },
      { module: "Library", actions: ["read"] },
    ],
    "Hostel Warden": [
      { module: "Hostel", actions: ["read", "update"] },
      { module: "Rooms", actions: ["read", "update"] },
    ],
    "Transport Manager": [
      { module: "Transport", actions: ["read", "update"] },
      { module: "Routes", actions: ["read", "update"] },
      { module: "Vehicles", actions: ["read", "update"] },
    ],
    "Exam Coordinator": [
      { module: "Exams", actions: ["create", "read", "update", "delete"] },
      { module: "Reports", actions: ["read", "export"] },
    ],
    Receptionist: [
      { module: "Users", actions: ["read", "create"] },
      { module: "Students", actions: ["read"] },
    ],
    "IT Support": [
      { module: "Settings", actions: ["read", "update"] },
      { module: "Users", actions: ["read", "update"] },
    ],
    Counselor: [
      { module: "Students", actions: ["read", "update"] },
      { module: "Parents", actions: ["read"] },
    ],
    "Subject Coordinator": [
      { module: "Subjects", actions: ["create", "read", "update"] },
      { module: "Teachers", actions: ["read"] },
    ],
    Security: [
      { module: "Attendance", actions: ["create", "read"] },
      { module: "Transport", actions: ["read"] },
      { module: "Notifications", actions: ["read"] },
    ],
    "Sports Teacher": [
      { module: "Students",    actions: ["read"] },
      { module: "Attendance",  actions: ["create", "read"] },
      { module: "Assignments", actions: ["create", "read", "update", "delete"] },
      { module: "Timetable",   actions: ["read"] },
      { module: "Notifications", actions: ["read"] },
    ],
    "Lab Technician": [
      { module: "Students",      actions: ["read"] },
      { module: "Inventory",     actions: ["read", "update"] },
      { module: "Attendance",    actions: ["create", "read"] },
      { module: "Notifications", actions: ["read"] },
    ],
    "Medical Officer": [
      { module: "Students",      actions: ["read", "update"] },
      { module: "Attendance",    actions: ["read"] },
      { module: "Notifications", actions: ["read"] },
      { module: "Reports",       actions: ["read"] },
    ],
    "Class Teacher": [
      { module: "Students",    actions: ["read"] },
      { module: "Assignments", actions: ["create", "read", "update", "delete"] },
      { module: "Attendance",  actions: ["create", "read"] },
      { module: "Timetable",   actions: ["read"] },
      { module: "Notifications", actions: ["read"] },
    ],
  };
  const ROLE_LEVEL_MAP = {
    "Super Admin": 1,
    "School Admin": 2,
    "Principal": 2,
    "Vice Principal": 2,
    "Teacher": 3,
    "Subject Coordinator": 3,
    "Student": 4,
    "Parent": 4,
    "Accountant": 4,
    "Staff": 4,
    "Support Staff": 4,
    "Librarian": 4,
    "Hostel Warden": 4,
    "Transport Manager": 4,
    "Exam Coordinator": 4,
    "Receptionist": 4,
    "IT Support": 4,
    "Counselor": 4,
    "Security": 4,
    "Sports Teacher": 3,
    "Lab Technician": 4,
    "Medical Officer": 4,
    "Class Teacher": 3,
  };
  // ✅ Helper to validate permissions
  const validatePermissions = (permissions) => {
    if (!Array.isArray(permissions)) {
      throw new ApiError(400, "Permissions must be an array");
    }
    permissions.forEach((perm) => {
      if (!perm.module || !Array.isArray(perm.actions)) {
        throw new ApiError(400, "Each permission must include module and actions[]");
      }
      perm.actions.forEach((action) => {
        if (!allActions.includes(action)) {
          throw new ApiError(400, `Invalid action: ${action} in module ${perm.module}`);
        }
      });
    });
  };

  /**
   * ✅ Create Role
   */
  export const createRole = asyncHandler(async (req, res) => {
    let {
      name,
      code,
      description,
      type,
      level,
      permissions,
      schoolId,
    } = req.body;

    /* ===============================
       1. BASIC VALIDATION
    ================================ */
    if (!name || typeof name !== "string") {
      throw new ApiError(400, "Role name is required");
    }

    // Normalize name & code
    name = name.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    code = code
      ? code.trim().toUpperCase()
      : name.replace(/\s+/g, "_").toUpperCase();

    /* ===============================
       2. AUTO ROLE TYPE
    ================================ */
    const SYSTEM_ROLES = ["Super Admin"];

    // Only Super Admin can explicitly create system roles
    if (type === "system" && req.userRole?.name !== "Super Admin") {
      throw new ApiError(403, "Only Super Admin can create system roles");
    }

    if (!type) {
      type = SYSTEM_ROLES.includes(name) ? "system" : "custom";
    }

    /* ===============================
       3. AUTO ROLE LEVEL (🔥 MAIN PART)
    ================================ */
    if (!level) {
      level = ROLE_LEVEL_MAP[name] || 4;
    }

    /* ===============================
       4. SCHOOL ID LOGIC
    ================================ */
    let schoolObjectId = null;

    // System roles → no school
    if (type === "custom") {
      if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
        throw new ApiError(
          400,
          "Valid schoolId is required for custom roles"
        );
      }
      schoolObjectId = new mongoose.Types.ObjectId(schoolId);
    }

    /* ===============================
       5. PERMISSIONS
    ================================ */
    if (!permissions || permissions.length === 0) {
      permissions = defaultPermissions[name];
      if (!permissions) {
        throw new ApiError(
          400,
          `No default permissions defined for role: ${name}`
        );
      }
    }

    validatePermissions(permissions);

    /* ===============================
       6. DUPLICATE CHECK
    ================================ */
    const existingRole = await Role.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      schoolId: schoolObjectId, // null for system
    });

    if (existingRole) {
      throw new ApiError(400, `Role "${name}" already exists`);
    }

    /* ===============================
       7. CREATE ROLE
    ================================ */
    const role = await Role.create({
      name,
      code,
      description: description || "",
      type,
      level,
      permissions,
      schoolId: schoolObjectId, // null for system
      createdBy: req.user._id,
    });

    /* ===============================
       8. RESPONSE
    ================================ */
    return res.status(201).json(
      new ApiResponse(201, role, "Role created successfully")
    );
  });

  /**
   * ✅ Get All Roles
   */
  export const getAllRoles = asyncHandler(async (req, res) => {
    const isSuperAdmin = req.userRole?.name === "Super Admin";
    // Non-Super-Admin only sees roles belonging to their school + system roles
    const query = isSuperAdmin
      ? {}
      : { $or: [{ schoolId: req.user.schoolId }, { type: "system" }] };
    const roles = await Role.find(query).sort({ level: 1 });
    res.status(200).json(new ApiResponse(200, roles, "Roles retrieved successfully"));
  });

  /**
   * ✅ Get Role By ID
   */
  export const getRoleById = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw new ApiError(404, "Role not found");

    // Same ownership check updateRole/deleteRole already enforce — this had none, letting School
    // Admin view another school's custom role (including its exact permissions array) by ID.
    if (req.userRole?.name !== "Super Admin" && role.type !== "system" &&
        role.schoolId?.toString() !== req.user.schoolId?.toString()) {
      throw new ApiError(403, "Access denied");
    }

    res.status(200).json(new ApiResponse(200, role, "Role found successfully"));
  });

  /**
   * ✅ Update Role
   */
  export const updateRole = asyncHandler(async (req, res) => {
    const { name, permissions, description } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) throw new ApiError(404, "Role not found");

    // School Admin cannot modify roles from other schools
    if (req.userRole?.name !== "Super Admin" &&
        role.schoolId?.toString() !== req.user.schoolId?.toString()) {
      throw new ApiError(403, "Access denied");
    }

    if (role.type === "system" && name && name !== role.name) {
      throw new ApiError(403, "Cannot rename a system role");
    }

    if (permissions) validatePermissions(permissions);

    role.name = name || role.name;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;

    await role.save();

    res.status(200).json(new ApiResponse(200, role, "Role updated successfully"));
  });

  /**
   * ✅ Delete Role
   */
  export const deleteRole = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw new ApiError(404, "Role not found");
    if (role.type === "system") throw new ApiError(403, "Cannot delete a system role");

    // School Admin cannot delete roles from other schools
    if (req.userRole?.name !== "Super Admin" &&
        role.schoolId?.toString() !== req.user.schoolId?.toString()) {
      throw new ApiError(403, "Access denied");
    }

    await role.deleteOne();
    res.status(200).json(new ApiResponse(200, null, "Role deleted successfully"));
  });

  /**
   * ✅ Get Roles By School
   */
  export const getRoleBySchool = asyncHandler(async (req, res) => {
    const { schoolId } = req.query;

    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new ApiError(400, "Valid schoolId is required in query parameters");
    }

    const roles = await Role.find({ schoolId: new mongoose.Types.ObjectId(schoolId) });
    res.status(200).json(new ApiResponse(200, roles, "Roles fetched successfully"));
  });

  /**
   * ✅ Search Roles (with pagination)
   */
  export const searchRoles = asyncHandler(async (req, res) => {
    const {
      name,
      schoolId,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (name) query.name = { $regex: escapeRegex(name), $options: "i" };
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) query.schoolId = schoolId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const roles = await Role.find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRoles = await Role.countDocuments(query);

    res.status(200).json({
      success: true,
      total: totalRoles,
      page: parseInt(page),
      totalPages: Math.ceil(totalRoles / parseInt(limit)),
      data: roles,
    });
  });
