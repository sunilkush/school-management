import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, schoolId, classId, parentId, isActive } = req.body

    if ([name, email, password, role, isActive].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields Requied !")
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, "User already registered with this email");
    }

    const avtarlocalPath = req.files?.avtar[0]?.path

    if (!avtarlocalPath) {
        throw new ApiError(400, "avtar local Path not found !")
    }

    const avtar = await uploadOnCloudinary(avtarlocalPath)

    if (!avtar) {
        throw new ApiError(400, "avtar didn't upload !")
    }

    const newUser = await User.create({
        name,
        email,
        password,
        role,
        avtar: avtar.url || "",
        schoolId,
        classId,
        parentId,
        isActive: true
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user create
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //  return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

});

const updateUser = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, role, schoolId, classId, parentId } = req.body;

        // Step 1: Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Step 2: Update user fields (only if provided)
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (schoolId) user.schoolId = schoolId;
        if (classId) user.classId = classId;
        if (parentId) user.parentId = parentId;

        // Step 3: Save updated user
        const updatedUser = await user.save();

        const userUpdate = await updatedUser.findById(userId).select("-password,refreshToken")

        res.status(200).json(
            new ApiResponse(200, userUpdate, "User updated successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "User update failed");
    }
});




export {
    registerUser,
    updateUser
}
