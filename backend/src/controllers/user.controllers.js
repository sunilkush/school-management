import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'

// ✅ Generate Access & Refresh Token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, 'User not found')
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, 'Error generating tokens')
    }
}

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Private (Only Super Admin & School Admin)
 */
// Register User (POST)
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, roleId, schoolId, classId, parentId } = req.body

    if (
        [name, email, password, roleId, schoolId].some(
            (field) => !field?.trim() === ''
        )
    ) {
        // throw new ApiError(400, "All fields are required");
        return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        return res
            .status(400)
            .json({ message: 'User already registered with this email' })
        // throw new ApiError(400,"User already registered with this email" );
    }

    let avatarUrl = ''
    if (
        req.files?.avatar &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        const avatarPath = req.files.avatar[0].path
        const avatar = await uploadOnCloudinary(avatarPath)
        avatarUrl = avatar?.url || ''
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
        isActive: true,
    })

    const createdUser = await User.findById(newUser._id).select(
        '-password -refreshToken'
    )

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, 'User registered successfully'))
})

// Login User (POST)
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    console.log(user)
    if (!user || !(await user.isPasswordCorrect(password))) {
        return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.isActive) {
        return res.status(403).json({
            message: 'User status: inactive. Please contact the administrator.',
        })
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    )

    // Use aggregation to join role collection
    const userWithRole = await User.aggregate([
        { $match: { _id: user._id } },
        {
            $lookup: {
                from: 'roles', // Make sure your collection is named 'roles'
                localField: 'roleId',
                foreignField: '_id',
                as: 'role',
            },
        },
        {
            $unwind: {
                path: "$role",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'schools', // Make sure your collection is named 'roles'
                localField: 'schoolId',
                foreignField: '_id',
                as: 'school',
            },
        },
        {
            $unwind: {
                path: "$school",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                avatar: 1,
                isActive: 1,
                role: {
                    _id: '$role._id',
                    name: '$role.name',
                    permissions: '$role.permissions', // ✅ Include permissions here
                },
                school: {
                    _id: '$school._id',
                    name: '$school.name',
                },
            },
        },
    ])
    console.log(userWithRole)
    if (!userWithRole || userWithRole.length === 0) {
        return res.status(500).json({ message: 'User role aggregation failed' });
    }
    const finalUser = userWithRole[0]

    return res
        .status(200)
        .cookie('accessToken', accessToken, { httpOnly: true, secure: true })
        .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true })
        .json(
            new ApiResponse(
                200,
                { user: finalUser, accessToken, refreshToken },
                'User logged in successfully'
            )
        )
})

// Update User Profile (PUT)
const updateUser = asyncHandler(async (req, res) => {
    const { name, email } = req.body

    if (!name || !email) {
        throw new ApiError(400, 'All fields are required')
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    user.name = name
    user.email = email
    await user.save()

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'User updated successfully'))
})

// Change Password (PUT)
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'All fields are required')
    }

    const user = await User.findById(req.user?._id)
    if (!user || !(await user.isPasswordCorrect(oldPassword))) {
        throw new ApiError(400, 'Invalid old password')
    }

    user.password = newPassword
    await user.save()

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'))
})

// Get Current User (GET)
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'User fetched successfully'))
})

// Logout User (POST)
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } })

    return res
        .status(200)
        .clearCookie('accessToken', { httpOnly: true, secure: true })
        .clearCookie('refreshToken', { httpOnly: true, secure: true })
        .json(new ApiResponse(200, {}, 'User logged out successfully'))
})
// Get All Users (GET)
// This function retrieves all users, including their roles and schools, using aggregation.
const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'roles', // Make sure your collection is named 'roles'
                    localField: 'roleId',
                    foreignField: '_id',
                    as: 'role',
                },
            },
            { $unwind: '$role' },
            {
                $lookup: {
                    from: 'schools', // Make sure your collection is named 'roles'
                    localField: 'schoolId',
                    foreignField: '_id',
                    as: 'school',
                },
            },
            {
                $unwind: {
                    path: "$school",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    avatar: 1,
                    isActive: 1,
                    role: {
                        _id: '$role._id',
                        name: '$role.name',
                        permissions: '$role.permissions',
                    },
                    school: {
                        _id: '$school._id',
                        name: '$school.name',
                    },
                },
            },
        ]);

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
});

// deleteUser

 const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params
   
  if (!id) {
    return res.status(400).json({ message: 'User ID is required' })
  }
    // Find the user by ID and update their isActive status to false
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  )
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User deactivated successfully'))
})
export {
    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword,
    getCurrentUser,
    logoutUser,
    getAllUsers,
    deleteUser
}
