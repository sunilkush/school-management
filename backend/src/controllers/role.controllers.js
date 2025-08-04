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
// ✅ Create a Role (Only Admin)
export const createRole = asyncHandler(async (req, res) => {
  let { name, schoolId, permissions } = req.body;

  if (!name || typeof name !== "string") {
    throw new ApiError(400, "Role name is required and must be a string");
  }

  name = name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const isSuperAdmin = name === "Super Admin";
  let schoolObjectId = null;

  if (!isSuperAdmin) {
    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new ApiError(400, "Valid school ID is required for this role");
    }
    schoolObjectId = new mongoose.Types.ObjectId(schoolId);
  }

  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    permissions = defaultPermissions[name];
    if (!permissions) {
      throw new ApiError(400, `No default permissions defined for role: ${name}`);
    }
  }

  const query = {
    name: { $regex: `^${name}$`, $options: "i" },
    ...(schoolObjectId ? { schoolId: schoolObjectId } : {}),
  };

  const existingRole = await Role.findOne(query);
  if (existingRole) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Role already exists"));
  }

  const role = await Role.create({
    name,
    ...(schoolObjectId && { schoolId: schoolObjectId }),
    permissions,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, role, "Role created successfully"));
});



// ✅ Get All Roles (Only Admin)
export const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find();

    res.status(200).json(new ApiResponse(200, roles, "Roles retrieved successfully"));
});

// ✅ Get Role by ID (Only Admin)
export const getRoleById = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw new ApiError(404, "Role not found");
    res.status(200).json(new ApiResponse(200, role, "Role found successfully"));
});

// ✅ Update Role (Only Admin)
export const updateRole = asyncHandler(async (req, res) => {
    const { name, permissions } = req.body;

    const updatedRole = await Role.findByIdAndUpdate(
        req.params.id, { name, permissions }, { new: true }
    );

    if (!updatedRole) throw new ApiError(404, "Role not found");

    res.status(200).json(new ApiResponse(200, updatedRole, "Role updated successfully"));
});

// ✅ Delete Role (Only Admin)
export const deleteRole = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw new ApiError(404, "Role not found");

    await role.deleteOne();
    res.status(200).json(new ApiResponse(200, null, "Role deleted successfully"));
});


export const getRoleBySchool = asyncHandler(async (req, res) => {
    const { schoolId } = req.query;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "schoolId is required in query parameters",
        });
    }
    const roles = await Role.find({ schoolId });
    return res.status(200).json(
        new ApiResponse(200, roles, "Roles fetched successfully")
    );
});