import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

const resolveRoleId = (user) => {
  if (!user) return null;
  if (typeof user.roleId === "string") return user.roleId;
  if (user.roleId?._id) return user.roleId._id.toString();
  if (typeof user.role === "string") return user.role;
  if (user.role?._id) return user.role._id.toString();
  return null;
};

const fetchRole = async (user) => {
  const roleId = resolveRoleId(user);
  if (!roleId) throw new ApiError(401, "Unauthorized. No role assigned.");

  const userRole = await Role.findById(roleId).lean();
  if (!userRole) throw new ApiError(403, "Forbidden. Role not found.");

  return userRole;
};

export const auth = asyncHandler(async (req, _res, next) => {
  if (!ACCESS_SECRET) throw new ApiError(500, "Access token secret is not configured");

  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) throw new ApiError(401, "Unauthorized. Access token missing.");

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, ACCESS_SECRET);
  } catch {
    throw new ApiError(401, "Unauthorized. Invalid access token.");
  }

  const user = await User.findById(decodedToken?._id)
    .select("-password -refreshToken")
    .populate("roleId", "name permissions")
    .populate("additionalRoles", "name permissions");

  if (!user || user.isDeleted || !user.isActive) {
    throw new ApiError(401, "Unauthorized. User is invalid or inactive.");
  }

  req.user = user;
  req.userRole = user.roleId;
  req.userAdditionalRoles = user.additionalRoles || [];
  next();
});

export const requireAuth = auth;

export const allowPublic = (req, _res, next) => {
  req.isPublicRoute = true;
  next();
};
   const PUBLIC_API_ROUTE_PATTERNS = [
  /^\/user\/login$/,
  /^\/user\/refresh-token$/,
  /^\/user\/forgot-password$/,
  /^\/user\/reset-password\/[^/]+$/,
  /^\/user\/verify-email\/[^/]+$/,
  /^\/user\/resend-verification$/,
  /^\/health$/,
];

const isPublicApiRoute = (req) => {
  const normalizedPath = (req.path || "").replace(/\/+$/, "") || "/";
  return PUBLIC_API_ROUTE_PATTERNS.some((pattern) => pattern.test(normalizedPath));
};
export const enforceApiAuthByDefault = (req, _res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.isPublicRoute) return next();
  if (isPublicApiRoute(req)) return next();
  return auth(req, _res, next);
};

export const requireRoles = (allowedRoles = []) =>
  asyncHandler(async (req, _res, next) => {
    const role = req.userRole?.name ? req.userRole : await fetchRole(req.user);

    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const normalizedAllowed = rolesArray.map((r) => r.toLowerCase().trim());

    // Collect all role names: primary + additional
    const allRoleNames = [
      (role.name || "").toLowerCase().trim(),
      ...(req.userAdditionalRoles || []).map((r) => (r.name || "").toLowerCase().trim()),
    ];

    if (!normalizedAllowed.some((allowed) => allRoleNames.includes(allowed))) {
      throw new ApiError(403, "Forbidden. Insufficient role access.");
    }

    req.userRole = role;
    next();
  });

export const roleMiddleware = requireRoles;

export const authorize = (moduleName, action) =>
  asyncHandler(async (req, _res, next) => {
    const role = req.userRole?.permissions ? req.userRole : await fetchRole(req.user);
    const hasPermission = (role.permissions || []).some(
      (permission) =>
        permission.module === moduleName &&
        Array.isArray(permission.actions) &&
        permission.actions.includes(action)
    );

    if (!hasPermission) {
      throw new ApiError(403, `Forbidden. Permission denied for ${action} on ${moduleName}`);
    }

    req.userRole = role;
    next();
  });
