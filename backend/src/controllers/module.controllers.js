import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Role } from "../models/Roles.model.js";

const getMyModules = asyncHandler(async (req, res) => {
  const roleId = req?.user?.roleId?._id || req?.user?.roleId;

  if (!roleId) {
    throw new ApiError(401, "Unauthorized. No role assigned.");
  }

  const role = await Role.findById(roleId).lean();
  if (!role) {
    throw new ApiError(403, "Role not found");
  }

  const modules = (role.permissions || []).map((permission) => ({
    module: permission.module,
    actions: permission.actions || [],
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, { role: role.name, modules }, "Modules fetched successfully"));
});

export { getMyModules };
