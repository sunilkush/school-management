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

// 🔹 Generate next regId school-wise
export const generateNextRegId = async (schoolId) => {
  const lastUser = await User.findOne({ schoolId })
    .sort({ createdAt: -1 })
    .select("regId");

  let newId = "#000001"; // default for first user
  if (lastUser && lastUser.regId) {
    const lastNum = parseInt(lastUser.regId.replace("#", "")) || 0;
    newId = "#" + String(lastNum + 1).padStart(6, "0");
  }

  return newId;
};
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

  // ✅ Check Academic Year
  let academicYearId = null;
  const activeAcademicYear = await AcademicYear.findOne({
    schoolId,
    status: "active",
  });
  if (activeAcademicYear) {
    academicYearId = activeAcademicYear._id;
  }

  // ✅ Email exists check
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already registered with this email");
  }

  // ✅ Handle avatar
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

  // ✅ Generate Registration ID (for every user, not just students)
  const regId = await generateNextRegId(schoolId);

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
    regId,          // 🔹 auto-generated
    isActive: true,
    academicYearId,
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

  // 🔹 Find user and populate role + school
  const user = await User.findOne({ email })
    .populate("roleId")
    .populate("schoolId");

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 🔹 Check user active status
  if (!user.isActive) {
    throw new ApiError(403, "User is inactive. Please contact administrator.");
  }

  // 🔹 If NOT Super Admin → check if school is active
  const isSuperAdmin =
    user.roleId && user.roleId.name?.toLowerCase() === "super admin";

  if (!isSuperAdmin) {
    if (!user.schoolId || user.schoolId.isActive === false) {
      throw new ApiError(
        403,
        "Your school is deactivated. Please contact administrator."
      );
    }
  }

  // 🔹 Generate tokens
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user._id);

  // 🔹 Enrich user details via aggregation (optional)
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
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: { path: "$academicYear", preserveNullAndEmptyArrays: true } },

    // Projection
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
          isActive: "$school.isActive",
        },
        academicYear: {
          _id: "$academicYear._id",
          name: "$academicYear.name",
          startDate: "$academicYear.startDate",
          endDate: "$academicYear.endDate",
          isActive: "$academicYear.isActive",
        },
      },
    },
  ]);

  if (!userWithDetails || userWithDetails.length === 0) {
    throw new ApiError(500, "User aggregation failed");
  }

  const finalUser = userWithDetails[0];

  // 🔹 Send response
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

  const userId = new mongoose.Types.ObjectId(req.user._id);

  const userWithDetails = await User.aggregate([
    {
      $match: { _id: userId }
    },

    // ===== ROLE =====
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

    // ===== SCHOOL =====
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

    // ===== ACADEMIC YEAR =====
    {
      $lookup: {
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: { path: "$academicYear", preserveNullAndEmptyArrays: true } },

    // ===== PROJECTION =====
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
          isActive: "$school.isActive",
        },

        academicYear: {
          _id: "$academicYear._id",
          name: "$academicYear.name",
          startDate: "$academicYear.startDate",
          endDate: "$academicYear.endDate",
          isActive: "$academicYear.isActive",
        },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      userWithDetails[0] || null,
      "User fetched successfully"
    )
  );
});

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

    // Join Role
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

    // Join School
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

    // ✅ Join Academic Year
    {
      $lookup: {
        from: "academicyears",
        localField: "academicYearId", // assuming your User schema has academicYearId
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: { path: "$academicYear", preserveNullAndEmptyArrays: true } },

    // Final projection
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
        academicYear: {
          _id: "$academicYear._id",
          name: "$academicYear.name",
          startDate: "$academicYear.startDate",
          endDate: "$academicYear.endDate",
          isActive: "$academicYear.isActive",
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

const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params // using query ?id=

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Valid User ID is required");
  }

  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },

    // Join Role
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

    // Join School
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

    // Join Academic Year
    {
      $lookup: {
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: { path: "$academicYear", preserveNullAndEmptyArrays: true } },

    // Projection
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
        isActive: 1,
        regId: 1,

        role: {
          _id: "$role._id",
          name: "$role.name",
          permissions: "$role.permissions",
        },
        school: {
          _id: "$school._id",
          name: "$school.name",
        },
        academicYear: {
          _id: "$academicYear._id",
          name: "$academicYear.name",
          startDate: "$academicYear.startDate",
          endDate: "$academicYear.endDate",
          isActive: "$academicYear.isActive",
        },
      },
    },
  ]);

  if (!user || user.length === 0) {
    throw new ApiError(404, "User not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user[0], "User fetched successfully!"));
});


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
  getUserById
}
