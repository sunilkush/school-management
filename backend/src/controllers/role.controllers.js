import { Role } from "../models/Roles.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from 'mongoose';
// ✅ Create a Role (Only Admin)
export const createRole = asyncHandler(async (req, res) => {
    const { name, schoolId, permissions } = req.body;

    // Validate schoolId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        throw new ApiError(400, "Invalid school ID");
    }

    // Validate permissions
    if (
        !Array.isArray(permissions) ||
        permissions.some(p => !p.module || !Array.isArray(p.actions))
    ) {
        throw new ApiError(400, "Invalid permissions format");
    }

    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

    // Check if role already exists in the same school
    const existingRole = await Role.findOne({ name, schoolId: schoolObjectId });
    if (existingRole) {
        throw new ApiError(400, "Role already exists for this school");
    }

    // Create the new role
    const role = await Role.create({
        name,
        schoolId: schoolObjectId,
        permissions,
    });
     console.log(role)
    // Return response
    return res.status(201).json(
        new ApiResponse(201, role, "Role created successfully")
    );
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