import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import jwt from "jsonwebtoken";
import {
  BILLING_ONLY_STATUS, billingOnlyMessage, canUseBillingOnly, findSchoolAccessProblem, isBillingOnlyPath, isSuperAdminUser,
} from "../utils/schoolAccess.js";

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
  // Read lazily (not cached at module-import time): dotenv.config() runs in app.js's own body,
  // which ES modules only execute *after* every static import — including this file's — has
  // already been evaluated. A top-level `const` here would race that and can end up permanently
  // undefined depending on unrelated import-order changes elsewhere in the graph. user.model.js
  // and user.controllers.js already read these same secrets lazily for the same reason.
  const accessSecret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!accessSecret) throw new ApiError(500, "Access token secret is not configured");

  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) throw new ApiError(401, "Unauthorized. Access token missing.");

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, accessSecret);
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

  // Switching a school off, or its subscription expiring or being suspended or cancelled, now ends
  // its users' sessions instead of waiting for their tokens to run out. 401 so the browser tries a
  // refresh, which is refused with the reason and signs them out.
  // An expired plan's School Admin keeps the billing pages so the school can pay its way back in
  // (utils/schoolAccess.js); anything else they ask for is answered 402, which opens that page.
  if (user.schoolId && !isSuperAdminUser(user)) {
    const problem = await findSchoolAccessProblem(user.schoolId);
    if (problem) {
      if (!canUseBillingOnly(problem, user)) throw new ApiError(401, problem.message);
      if (!isBillingOnlyPath(req.originalUrl || req.url)) throw new ApiError(BILLING_ONLY_STATUS, billingOnlyMessage(problem));
      req.billingOnly = true;
    }
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
  /^\/certificates\/verify\/[^/]+$/,
  /^\/id-cards\/verify\/[^/]+$/,
  // Gateway webhooks are called server-to-server by Razorpay itself, never by a logged-in
  // user — authenticity is instead enforced by HMAC signature verification inside
  // webhook.controllers.js, not a session/JWT.
  /^\/webhooks\/razorpay$/,
  // Per-school gateway webhooks (Razorpay, Cashfree, PayU, PhonePe, Paytm, CCAvenue, Easebuzz):
  // each is checked against that gateway's own signature with that school's credentials, and the
  // payment is then confirmed by asking the gateway directly.
  /^\/webhooks\/gateway\/[a-z]+\/[a-f\d]{24}$/,
  // The payer's browser returning from a gateway. Carries no login; it only triggers a
  // server-to-server status check (payment.controllers.js returnFromGateway).
  /^\/payments\/return\/[a-f\d]{24}$/,
  // Public admission portal — a prospective parent has no account yet, so the whole
  // apply/track/upload flow runs unauthenticated. Abuse is bounded by per-route rate limits
  // (routes/publicAdmission.routes.js) and every lookup requires the application number *and*
  // the registered phone, so applicants can't be enumerated. Keep these in sync with that
  // route file — a path that exists there but not here will 401.
  /^\/public\/admissions\/schools$/,
  /^\/public\/admissions\/schools\/[^/]+$/,
  /^\/public\/admissions\/track$/,
  /^\/public\/admissions\/apply$/,
  /^\/public\/admissions\/documents\/[^/]+$/,
  // Attendance readers (fingerprint terminals, RFID gates) are machines on a school's own
  // network with no account to log in with. Authenticity is enforced by an HMAC signature over
  // the body using the device's shared secret, checked inside attendanceDevice.controllers.js —
  // exactly the arrangement the Razorpay webhook above uses. Keep these in sync with
  // routes/attendanceDevice.routes.js: a path there but not here will 401.
  /^\/attendance-devices\/punches$/,
  /^\/attendance-devices\/heartbeat$/,
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
