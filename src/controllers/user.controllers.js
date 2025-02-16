import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(404, "something went wrong while access & refresh token")
    }

}
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

    const createdUser = await User.findById(newUser._id).select(
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

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if ([email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fiedls are Required ?")
    }



    const user = await User.findOne({ $or: [{ email }] })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        secure: true,
        httpOnly: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, refreshToken, accessToken,
            }, "user logged in successfully")
        )
})

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
        const updatedUser = await user.save({ validateBeforeSave: false });

        const userUpdate = await updatedUser.findById(userId).select("-password,refreshToken")

        res.status(200).json(
            new ApiResponse(200, userUpdate, "User updated successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "User update failed");
    }
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if ([oldPassword, newPassword].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are Required !")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old Password invalid")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

export {
    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword
}
