import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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

    const avtarlocalPath = req.files?.avatar[0]?.path

    if (!avtarlocalPath) {
        throw new ApiError(400, "avtar local Path not found !")
    }

    const avatar = await uploadOnCloudinary(avtarlocalPath)

    if (!avatar) {
        throw new ApiError(400, "avtar didn't upload !")
    }

    const newUser = await User.create({
        name,
        email,
        password,
        role,
        avatar: avatar.url || "",
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
    // get value on frontend
    // user validation
    // find the user
    // password check
    // access & refresh token
    // send cookie

    const { email, password } = req.body;

    // 1️⃣ Validate request data
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    // 2️⃣ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    // 3️⃣ Compare passwords
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password." });
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

        const { name, email } = req.body
        if (!email || !name) {
            throw new ApiError(400, "All fields are required please set")
        }

        // Step 1: Check if the user exists
        const user = await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                name: name,
                email: email
            }
        }, {
            new: true
        }).select("-password")

        res.status(200).json(
            new ApiResponse(200, user, "User updated successfully")
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




const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "User fetched successfully")
        )
});
const logoutUser = asyncHandler(async (req, res) => {
    // user find
    // user refresh token delete  
    // return response
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    }, {
        new: true
    })

    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})
export {
    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword,
    getCurrentUser,
    logoutUser
}
