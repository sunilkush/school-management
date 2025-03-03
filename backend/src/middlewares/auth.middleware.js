import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config()

const auth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
      throw new ApiError(401, "Unauthorized Token !")
    }

    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodeToken?._id).select("-password -refreshToken").populate("role");
    if (!user) {
      throw new ApiError(401, "Invalid Access Request")
    }
    req.user = user
    next()

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }

})

const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {

    try {
      const userRole = await Role.findById(req.user?.role) // Assuming req.user is populated after authentication

      if (!userRole || !allowedRoles.includes(userRole.name)) {
        return res.status(403).json({ message: "Access denied. You do not have the necessary permissions." });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "An error occurred during role validation.", error: error.message });
    }
  };
};


export { auth, roleMiddleware }