import { Role } from "../models/Roles.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from 'mongoose';


// ✅ Default permissions map
const defaultPermissions = {
  "Super Admin": [
    { module: "Schools", actions: ["create", "read", "update", "delete"] },
    { module: "Users", actions: ["create", "read", "update", "delete"] },
    { module: "Settings", actions: ["read", "update"] }
  ],
  "School Admin": [
    { module: "Users", actions: ["create", "read", "update", "delete"] },
    { module: "Students", actions: ["create", "read", "update", "delete"] },
    { module: "Teachers", actions: ["create", "read", "update", "delete"] },
    { module: "Parents", actions: ["create", "read", "update", "delete"] },
    { module: "Classes", actions: ["create", "read", "update", "delete"] },
    { module: "Subjects", actions: ["create", "read", "update", "delete"] },
    { module: "Timetable", actions: ["create", "read", "update"] },
    { module: "Settings", actions: ["read", "update"] },
    { module: "Reports", actions: ["read", "export"] }
  ],
  "Teacher": [
    { module: "Students", actions: ["read"] },
    { module: "Assignments", actions: ["create", "read", "update", "delete"] },
    { module: "Timetable", actions: ["read"] },
    { module: "Attendance", actions: ["create", "read"] }
  ],
  "Student": [
    { module: "Assignments", actions: ["read"] },
    { module: "Timetable", actions: ["read"] },
    { module: "Reports", actions: ["read"] }
  ],
  "Parent": [
    { module: "Students", actions: ["read"] },
    { module: "Reports", actions: ["read"] },
    { module: "Fees", actions: ["read"] },
    { module: "Notifications", actions: ["read"] }
  ],
  "Accountant": [
    { module: "Fees", actions: ["create", "read", "update", "delete", "collect"] },
    { module: "Finance", actions: ["create", "read", "update", "delete", "export"] },
    { module: "Expenses", actions: ["create", "read", "update", "delete"] }
  ],
  "Staff": [
    { module: "Attendance", actions: ["create", "read"] },
    { module: "Notifications", actions: ["read"] }
  ],
  "Librarian": [
    { module: "Books", actions: ["create", "read", "update", "delete"] },
    { module: "IssuedBooks", actions: ["create", "read", "return"] },
    { module: "Library", actions: ["read"] }
  ],
  "Hostel Warden": [
    { module: "Hostel", actions: ["read", "update"] },
    { module: "Rooms", actions: ["read", "update"] }
  ],
  "Transport Manager": [
    { module: "Transport", actions: ["read", "update"] },
    { module: "Routes", actions: ["read", "update"] },
    { module: "Vehicles", actions: ["read", "update"] }
  ],
  "Exam Coordinator": [
    { module: "Exams", actions: ["create", "read", "update", "delete"] },
    { module: "Reports", actions: ["read", "export"] }
  ],
  "Receptionist": [
    { module: "Users", actions: ["read", "create"] },
    { module: "Students", actions: ["read"] }
  ],
  "IT Support": [
    { module: "Settings", actions: ["read", "update"] },
    { module: "Users", actions: ["read", "update"] }
  ],
  "Counselor": [
    { module: "Students", actions: ["read", "update"] },
    { module: "Parents", actions: ["read"] }
  ],
  "Subject Coordinator": [
    { module: "Subjects", actions: ["create", "read", "update"] },
    { module: "Teachers", actions: ["read"] }
  ]
};
const allActions = ["create", "read", "update", "delete", "export", "collect", "return", "assign"];
/**
 * ✅ Create Role
 */
export const createRole = asyncHandler(async (req, res) => {
  let { name, code, type, level, description, schoolId, permissions } = req.body;

  if (!name || typeof name !== "string") {
    throw new ApiError(400, "Role name is required and must be a string");
  }

  name = name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  code = code || name.replace(/\s+/g, "_").toUpperCase(); // e.g. "School Admin" → "SCHOOL_ADMIN"
  type = type || (["Super Admin", "School Admin", "Teacher", "Student"].includes(name) ? "system" : "custom");
  level = level || (name === "Super Admin" ? 1 : name === "School Admin" ? 2 : name === "Teacher" ? 3 : 4);

  let schoolObjectId = null;
  if (type !== "system") {
    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new ApiError(400, "Valid school ID is required for custom roles");
    }
    schoolObjectId = new mongoose.Types.ObjectId(schoolId);
  }

  if (!permissions || permissions.length === 0) {
    permissions = defaultPermissions[name];
    if (!permissions) {
      throw new ApiError(400, `No default permissions defined for role: ${name}`);
    }
  }

  // ✅ Validate actions
  permissions.forEach((perm) => {
    if (!Array.isArray(perm.actions) || perm.actions.some(a => !allActions.includes(a))) {
      throw new ApiError(400, `Invalid actions in permissions for module ${perm.module}`);
    }
  });

  // ✅ Prevent duplicate
  const existingRole = await Role.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
    ...(schoolObjectId ? { schoolId: schoolObjectId } : { schoolId: null })
  });
  if (existingRole) throw new ApiError(400, "Role already exists");

  const role = await Role.create({
    name,
    code,
    type,
    level,
    description: description || "",
    permissions,
    ...(schoolObjectId && { schoolId: schoolObjectId })
  });

  return res.status(201).json(new ApiResponse(201, role, "Role created successfully"));
});

/**
 * ✅ Get All Roles
 */
export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ level: 1 });
  res.status(200).json(new ApiResponse(200, roles, "Roles retrieved successfully"));
});

/**
 * ✅ Get Role By ID
 */
export const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, "Role not found");
  res.status(200).json(new ApiResponse(200, role, "Role found successfully"));
});

/**
 * ✅ Update Role
 */
export const updateRole = asyncHandler(async (req, res) => {
  const { name, permissions, description } = req.body;
  const role = await Role.findById(req.params.id);

  if (!role) throw new ApiError(404, "Role not found");
  if (role.type === "system" && name && name !== role.name) {
    throw new ApiError(403, "Cannot rename a system role");
  }

  // Validate permissions if provided
  if (permissions) {
    permissions.forEach((perm) => {
      if (!Array.isArray(perm.actions) || perm.actions.some(a => !allActions.includes(a))) {
        throw new ApiError(400, `Invalid actions in permissions for module ${perm.module}`);
      }
    });
  }

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

  await role.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Role deleted successfully"));
});

/**
 * ✅ Get Roles By School
 */
export const getRoleBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.query;
  if (!schoolId) throw new ApiError(400, "schoolId is required in query parameters");

  const roles = await Role.find({ schoolId: new mongoose.Types.ObjectId(schoolId) });
  res.status(200).json(new ApiResponse(200, roles, "Roles fetched successfully"));
});


// Search Roles Controller
export const searchRoles = async (req, res) => {
  try {
    const {
      name,            // optional - role name search
      schoolId,        // optional - filter by school
      page = 1,        // default page
      limit = 10,      // default limit
      sortBy = "createdAt", // default sorting
      sortOrder = "desc"    // default order
    } = req.query;

    const query = {};

    // 🔍 Search by Role Name (case-insensitive, partial match)
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // 🎓 Filter by School ID
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
      query.schoolId = schoolId;
    }

    // 📦 Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 📊 Fetch roles with pagination & sorting
    const roles = await Role.find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 📌 Count total records
    const totalRoles = await Role.countDocuments(query);

    res.status(200).json({
      success: true,
      total: totalRoles,
      page: parseInt(page),
      totalPages: Math.ceil(totalRoles / parseInt(limit)),
      data: roles
    });

  } catch (error) {
    console.error("Error searching roles:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching roles",
      error: error.message
    });
  }
};