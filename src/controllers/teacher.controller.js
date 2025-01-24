import { Teacher } from "../models/teacher.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Add a Teacher 

const addTeacher = asyncHandler(async()=>{
    const { name, email, subject, phone } = req.body;
})

