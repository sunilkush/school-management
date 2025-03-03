import { Role } from "../models/Roles.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// 🔹 Create a Role
const createRole = asyncHandler(async (req, res) => {
    try {
        const { name, permissions } = req.body;

        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            throw new ApiError(400, "Role already exists")
        }

        const role = new Role({ name, permissions });
        await role.save();

        return res.status(200).json(
            new ApiResponse(201, role, "Role Created Successfully")
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Server Error")
    }
});

// 🔹 Get All Roles
const getAllRoles = asyncHandler(
    async (req, res) => {
        try {
            const roles = await Role.find();
            return res.status(200).json(
                200, { roles }, "Successfully role"
            )


        } catch (error) {
            throw new ApiError(500, error.message || "Server Error")
        }
    }
)

// 🔹 Get Role by ID
const getRoleById = asyncHandler(async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            throw new ApiError(404, "Role Not Found")
        };


        return res.status(200).json(200, role, "Successfully found !")

    } catch (error) {
        throw new ApiError(500, error.message || "Server Error")
    }
});

// 🔹 Update Role
const updateRole = asyncHandler(
    async (req, res) => {
        try {
            const { name, permissions } = req.body;

            const updatedRole = await Role.findByIdAndUpdate(
                req.params.id, { name, permissions }, { new: true }
            );

            if (!updatedRole) {
                throw new ApiError(404, "Role Not Found")

            };


            return res.status(200).json(200, updatedRole, "Role Updated Successfully",);

        } catch (error) {
            throw new ApiError(500, error.message || "Server Error")
        }
    }
);

// 🔹 Delete Role
const deleteRole = asyncHandler(
    async (req, res) => {
        try {
            await Role.findByIdAndDelete(req.params.id);
            return res.status(200).json(
                new ApiResponse(200, "Role Deleted Successfully")
            )
        } catch (error) {
            throw new ApiError(500, error.message || "Server Error")
        }
    }
);

export {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
}