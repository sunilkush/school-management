import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Role } from "../models/Roles.model.js";

// ✅ Generate Access & Refresh Token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
    }
};


/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Private (Only Super Admin & School Admin)
 */
// Register User (POST)
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, roleId, schoolId, classId, parentId } = req.body;

    if ([name, email, password, roleId, schoolId].some(field => !field?.trim() === "")) {
       // throw new ApiError(400, "All fields are required");
        return res.status(400).json({message:"All fields are required"})
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({message:"User already registered with this email"})
        // throw new ApiError(400,"User already registered with this email" );
    }

    let avatarUrl = "";
    if (req.files?.avatar && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        const avatarPath = req.files.avatar[0].path;
        const avatar = await uploadOnCloudinary(avatarPath);
        avatarUrl = avatar?.url || "";
    }

    const newUser = await User.create({
        name,
        email,
        password,
        roleId,
        avatar: avatarUrl,
        schoolId,
        classId,
        parentId,
        isActive: true
    });

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

// Login User (POST)
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
       // throw new ApiError(400, "Email and password are required");
        return res.status(400).json({message:"Email and password are required"})
    }

    const user = await User.findOne({ email });
    if(!user.isActive == true ){
        return res.status(403).json({
            message:"User status: inactive. Please contact the administrator."
        })
    } 
    if (!user || !(await user.isPasswordCorrect(password))) {
        //throw new ApiError(401, "Invalid email or password");
        return res.status(401).json({message:"Invalid email or password"})
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200)
        .cookie("accessToken", accessToken, { secure: true, httpOnly: true })
        .cookie("refreshToken", refreshToken, { secure: true, httpOnly: true })
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
    
});

// Update User Profile (PUT)
const updateUser = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.name = name;
    user.email = email;
    await user.save();

    return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

// Change Password (PUT)
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user?._id);
    if (!user || !(await user.isPasswordCorrect(oldPassword))) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get Current User (GET)
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// Logout User (POST)
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    return res.status(200)
        .clearCookie("accessToken", { httpOnly: true, secure: true })
        .clearCookie("refreshToken", { httpOnly: true, secure: true })
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export {

    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword,
    getCurrentUser,
    logoutUser
};
