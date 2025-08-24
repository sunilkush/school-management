import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { AcademicYear } from '../models/AcademicYear.model.js'
import mongoose from 'mongoose'
// ✅ Generate Access & Refresh Token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) throw new ApiError(404, 'User not found')

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
// ✅ Register User Controller
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, schoolId, classId, parentId } = req.body;
  
  if (!name || !email || !password || !roleId || !schoolId) {
    throw new ApiError(400, "All required fields must be provided");
  }
   let academicYearId = null;
   if (roleId && schoolId) {
    const activeAcademicYear = await AcademicYear.findOne({
      schoolId,
      status: "active",
    });

    if (activeAcademicYear) {
      academicYearId = activeAcademicYear._id;
    }
  }
  // ✅ Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already registered with this email");
  }

  // ✅ Handle avatar upload if provided
  let avatarUrl = "";
  if (
    req.files?.avatar &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    const avatarPath = req.files.avatar[0].path;
    const avatar = await uploadOnCloudinary(avatarPath);
    avatarUrl = avatar?.url || "";
  }

  // ✅ Generate Registration Number if role = student
  let regNumber = null;
  if (roleId === "studentRoleId") {   // 🔹 Replace "studentRoleId" with actual ObjectId or const reference
    regNumber = await generateNextRegNumber(schoolId);
  }

  // ✅ Create new User
  const newUser = await User.create({
    name,
    email,
    password,
    roleId,
    avatar: avatarUrl,
    schoolId,
    classId,
    parentId,
    regNumber, // ✅ only for students
    isActive: true,
    academicYearId
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});
/**
 * @desc Login user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "User is inactive. Please contact the administrator."
    );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  // ✅ Populate role, school, academic year
  const userWithDetails = await User.aggregate([
    { $match: { _id: user._id } },

    // Role
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

    // School
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

    // Academic Year
    {
      $lookup: {
        from: "academicyears", // ✅ lowercase collection name
        localField: "AcademicYearId",
        foreignField: "_id",
        as: "AcademicYear",
      },
    },
    { $unwind: { path: "$AcademicYear", preserveNullAndEmptyArrays: true } },

    // Final projection
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
        isActive: 1,
        role: {
          _id: "$role._id",
          name: "$role.name",
          permissions: "$role.permissions",
        },
        school: {
          _id: "$school._id",
          name: "$school.name",
        },
        AcademicYear: {
          _id: "$AcademicYear._id",
          name: "$AcademicYear.name",
        },
      },
    },
  ]);

  if (!userWithDetails || userWithDetails.length === 0) {
    throw new ApiError(500, "User aggregation failed");
  }

  const finalUser = userWithDetails[0];

  return res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
    .json(
      new ApiResponse(
        200,
        { user: finalUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});



/**
 * @desc Update user profile
 * @route PUT /api/users/update
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) throw new ApiError(400, 'All fields are required')

  const user = await User.findById(req.user?._id)
  if (!user) throw new ApiError(404, 'User not found')

  user.name = name
  user.email = email
  await user.save()

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User updated successfully'))
})

/**
 * @desc Change password
 * @route PUT /api/users/change-password
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword)
    throw new ApiError(400, 'Old and new passwords are required')

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

/**
 * @desc Get current logged-in user
 * @route GET /api/users/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'User fetched successfully'))
})

/**
 * @desc Logout user
 * @route POST /api/auth/logout
 */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } })

  return res
    .status(200)
    .clearCookie('accessToken', { httpOnly: true, secure: true })
    .clearCookie('refreshToken', { httpOnly: true, secure: true })
    .json(new ApiResponse(200, {}, 'User logged out successfully'))
})

/**
 * @desc Get all users with roles & schools
 * @route GET /api/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  let schoolId;

  // If Super Admin → use query param, else use user's own schoolId
  if (req.user?.role?.name && req.user.role.name === "Super Admin") {
    schoolId = req.query.schoolId;
  } else {
    schoolId = req.user?.schoolId;
  }

  const matchStage = schoolId
    ? { schoolId: new mongoose.Types.ObjectId(schoolId) }
    : {};

  const users = await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
        isActive: 1,
        regNumber: 1,
        role: {
          _id: "$role._id",
          name: "$role.name",
          permissions: "$role.permissions",
        },
        school: {
          _id: "$school._id",
          name: "$school.name",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});


/**
 * @desc Deactivate user
 * @route DELETE /api/users/:id
 */

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!id) throw new ApiError(400, 'User ID is required')

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  )

  if (!user) throw new ApiError(404, 'User not found')

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User deactivated successfully'))
})

/**
 * @desc Activate user
 * @route PATCH /api/users/:id/activate
 */
const activeUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!id) throw new ApiError(400, 'User ID is required')

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  )

  if (!user) throw new ApiError(404, 'User not found')

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User activated successfully'))
})

export {
  registerUser,
  loginUser,
  updateUser,
  changeCurrentPassword,
  getCurrentUser,
  logoutUser,
  getAllUsers,
  deleteUser,
  activeUser,
}
