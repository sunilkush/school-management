import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { School } from "../models/School.model.js";


const schoolRegister = asyncHandler(async (req, res) => {


    try {
        const { name, address, email, phone, website, logo, isActive } = req.body;

        // Check if required fields are present
        if (!name || !email) {
            throw new ApiError(400, "Name and Email are required");
        }

        // Check if the school already exists
        const existingSchool = await School.findOne({ email });

        if (existingSchool) {
            throw new ApiError(400, "School already registered with this email")

        }

        // Create new school
        const newSchool = new School({
            name,
            address,
            email,
            phone,
            website,
            logo,
            isActive: isActive === "true", // Convert string to boolean
        });

        // Save to database
        const savedSchool = await newSchool.save();

        res.status(201).json(
            new ApiResponse(200, savedSchool, "School registered successfully")
        );

    } catch (error) {

        throw new ApiError(500, error.message || "")
    }
})

export {
    schoolRegister
}

