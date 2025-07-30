import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {Role} from "../models/Roles.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config()

const auth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
   
    if (!token) {
     
      return res.status(401).json(
       new ApiError(401, "Unauthorized Token !")
      )
    }

    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    console.log(decodeToken)
    const user = await User.findById(decodeToken?._id).select("-password -refreshToken");

    if (!user) {
      
       return res.status(401).json(
       new ApiError(401, "Invalid Access Request")
      )
      
    }
    req.user = user
    next()

  } catch (error) {
     
     return res.status(401).json(
      new ApiError(401, error?.message || "Invalid access token")
      )
  }

})

const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {

    let roleId = req?.user?.roleId?._id; // ✅ Extract _id
    console.log("Role ID:", roleId); // Debugging log

    try {
      if (!roleId) {
         return res.status(401).json(
       new ApiError(401, "Unauthorized. No role assigned.")
      )
      }

      // Fetch role details using only _id
      const userRole = await Role.findById(roleId).lean(); // ✅ Use lean() for performance
      
       console.log( userRole.name)
      if (!userRole) {
       
          return res.status(403).json(
       new ApiError(401, "Access denied. Role not found."));
      }

      if (!allowedRoles.includes(userRole.name)) {

      
        return res.status(403).json(
          new ApiError(401, "Access denied. You do not have the necessary permissions."));
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        message: "An error occurred during role validation.", 
        error: error.message 
      });
    }
  };
};
const authorize = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      const roleId = req?.user?.roleId?._id || req?.user?.role;

      if (!roleId) {
        return res.status(403).json({ message: "No role assigned" });
      }

      const roleData = await Role.findById(roleId).lean();
      if (!roleData) return res.status(403).json({ message: "Role not found" });

      const hasPermission = roleData.permissions.some(
        (perm) => perm.module === moduleName && perm.actions.includes(action)
      );

      if (!hasPermission) {
        return res.status(403).json({ message: `Permission denied for ${action} on ${moduleName}` });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
};

export { auth, roleMiddleware,authorize }