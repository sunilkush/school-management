import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

const resolveRoleId = (user) => {
  if (!user) return null;

  if (typeof user.roleId === "string") return user.roleId;
  if (user.roleId && typeof user.roleId === "object") {
    if (user.roleId._id) return user.roleId._id.toString();
    if (user.roleId.toString) return user.roleId.toString();
  }

  if (typeof user.role === "string") return user.role;
  if (user.role && typeof user.role === "object" && user.role._id) {
    return user.role._id.toString();
  }

  return null;
};

const auth = asyncHandler(async (req, _res, next) => {
  if (!ACCESS_SECRET) {
    throw new ApiError(500, "Access token secret is not configured");
  }

  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized. Access token missing.");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, ACCESS_SECRET);
  } catch {
    throw new ApiError(401, "Unauthorized. Invalid access token.");
  }

  const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

  if (!user || user.isDeleted || !user.isActive) {
    throw new ApiError(401, "Unauthorized. User is invalid or inactive.");
  }

  req.user = user;
  next();
});

const roleMiddleware = (allowedRoles) => {
  return asyncHandler(async (req, _res, next) => {
    const roleId = resolveRoleId(req?.user);

    if (!roleId) {
      throw new ApiError(401, "Unauthorized. No role assigned.");
    }

    const userRole = await Role.findById(roleId).lean();

    if (!userRole) {
      throw new ApiError(403, "Forbidden. Role not found.");
    }

    if (!allowedRoles.includes(userRole.name)) {
      throw new ApiError(403, "Forbidden. Insufficient role access.");
    }

    req.userRole = userRole;
    next();
  });
};

const authorize = (moduleName, action) => {
  return asyncHandler(async (req, _res, next) => {
    const roleId = resolveRoleId(req?.user);

    if (!roleId) {
      throw new ApiError(403, "Forbidden. No role assigned.");
    }

    const roleData = await Role.findById(roleId).lean();
    if (!roleData) {
      throw new ApiError(403, "Forbidden. Role not found.");
    }

    const hasPermission = (roleData.permissions || []).some(
      (permission) =>
        permission.module === moduleName &&
        Array.isArray(permission.actions) &&
        permission.actions.includes(action)
    );

    if (!hasPermission) {
      throw new ApiError(403, `Forbidden. Permission denied for ${action} on ${moduleName}`);
    }

    req.userRole = roleData;
    next();
  });
};

export { auth, roleMiddleware, authorize };
