import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config()

const auth = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        throw new ApiError(401,"Unauthorized Token !")
    }
    
    const decodeToken= jwt.verify(token,process.env.REQUEST_TOKEN_SECRET )
   
    const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
   if(!user){
    throw new ApiError(401, "Invalid Access Request")
   }
   req.user = user
   next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})

const roles = asyncHandler(()=>{})

export {auth,roles}