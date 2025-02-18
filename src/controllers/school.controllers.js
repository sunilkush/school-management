import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { School } from "../models/school.model.js";


const schoolRegister = asyncHandler(async (req, res) => {

    try {
        const { name, address, email, phone, website, isActive } = req.body;

        // Check if required fields are present
        if (!name || !email) {
            throw new ApiError(400, "Name and Email are required");
        }

        // Check if the school already exists
        const existingSchool = await School.findOne({ email });

        if (existingSchool) {
            throw new ApiError(400, "School already registered with this email")

        }
        const logoLocalPath = req.files?.logo[0]?.path;

        if (!logoLocalPath) {
            throw new ApiError(400, "logoLocalPath not found !")
        }
        const uploadLogo = await uploadOnCloudinary(logoLocalPath)
        // Create new school
        const newSchool = new School({
            name,
            address,
            email,
            phone,
            website,
            logo: uploadLogo?.url || "",
            isActive, // Convert string to boolean
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

const schoolUpdate = asyncHandler(async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, address, email, phone, website, isActive } = req.body;

        // Step 1: Check if the school exists
        const school = await School.findById(schoolId);
        if (!school) {
            throw new ApiError(404, "School not found");
        }

        // Step 2: Handle optional fields (update if provided)
        if (name) school.name = name;
        if (address) school.address = address;
        if (email) school.email = email;
        if (phone) school.phone = phone;
        if (website) school.website = website;
        if (isActive !== undefined) school.isActive = isActive === "true";

        // Step 3: Handle Logo Upload (if new logo is provided)
        if (req.files?.logo?.[0]?.path) {
            const logoLocalPath = req.files.logo[0].path;
            const uploadedLogo = await uploadOnCloudinary(logoLocalPath);
            if (uploadedLogo?.url) {
                school.logo = uploadedLogo.url;
            }
        }

        // Step 4: Save updated school data
        const updatedSchool = await school.save();
        if (!updatedSchool) {
            throw new ApiError(400, "School update not fond")
        }
        return res.status(200).json(
            new ApiResponse(200, school, "school changes successfully")
        )

    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong !")
    }
})

const deactivateSchool = asyncHandler(async (req, res) => {
    try {
        const { schoolId } = req.params

        const school = await School.findByIdAndUpdate(schoolId, {
            $set: {
                isActive: false
            }
        }, {
            new: true
        });

        if (!school) {
            throw new ApiError(400, "School did't deactivate")
        }
        return res.status(200).json(
            new ApiResponse(200, school, "school deactivate successfully !")
        )

    } catch (error) {
        throw new ApiError(500, error.message || "")
    }

})

export {
    schoolRegister,
    schoolUpdate,
    deactivateSchool
}

