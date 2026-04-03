import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { AcademicYear } from '../models/AcademicYear.model.js'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendEmail } from '../utils/mailServices.js'
import { Role } from '../models/Roles.model.js'
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

const buildClientUrl = (path = '') => {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}${path}`;
};

const sendVerificationEmail = async (user) => {
  const token = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = buildClientUrl(`/verify-email/${token}`);
  await sendEmail(user.email, 'Verify your email', `Please verify your email by clicking this link: ${verifyUrl}`);
};


const getRoleById = async (roleId) => {
  if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) return null;
  return Role.findById(roleId).lean();
};

const getRequesterRoleName = async (req) => {
  if (req?.userRole?.name) return req.userRole.name;

  const roleId = req?.user?.roleId?._id || req?.user?.roleId;
  const roleDoc = await getRoleById(roleId);
  return roleDoc?.name || null;
};

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
  const { name, email, password, roleId, schoolId, schoolClassId, parentId, isActive } = req.body;

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
    if (!existingUser.isActive) {
      // ✅ Reactivate user
      existingUser.isActive = true;

      // optional: update other fields
      existingUser.name = req.body.name || existingUser.name;
      existingUser.role = req.body.role || existingUser.role;

      await existingUser.save();

      return res.status(200).json({
        message: "User re-activated successfully",
        user: existingUser,
      });
    }

    // ❌ Already active
    return res.status(400).json({
      message: "User already exists",
    });
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
    schoolClassId,
    parentId,
    regId,          // 🔹 auto-generated
    isActive,
    academicYearId,
  });

  await sendVerificationEmail(newUser);

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken -emailVerificationToken -resetPasswordToken"
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
   console.log("Login attempt:", { email }); // Debug log
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // 1️⃣ Find user
  const user = await User.findOne({ email })
    .populate("roleId")
    .populate("schoolId");

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 2️⃣ Active user check
  if (!user.isActive) {
    throw new ApiError(403, "User is inactive. Contact administrator.");
  }

  // 3️⃣ Role check
  const isSuperAdmin =
    user.roleId?.name?.toLowerCase() === "super admin";

  // 4️⃣ School active + email verification check (non super admin)
  if (!isSuperAdmin) {
    if (!user.schoolId || user.schoolId.isActive === false) {
      throw new ApiError(
        403,
        "Your school is deactivated. Contact administrator."
      );
    }

    /* if (!user.isEmailVerified) {
      throw new ApiError(403, "Email is not verified. Please verify before login.");
    } */
  }

  // 5️⃣ Tokens
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user._id);

  // 6️⃣ Aggregation for frontend-ready user
  const userWithDetails = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(user._id),
      },
    },

    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: "$role" },

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
      $lookup: {
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: { path: "$academicYear", preserveNullAndEmptyArrays: true } },

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

  if (!userWithDetails.length) {
    throw new ApiError(500, "User aggregation failed");
  }

  // 7️⃣ Response
  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .json(
      new ApiResponse(
        200,
        {
          user: userWithDetails[0],
          accessToken,
          refreshToken,
        },
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
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'Old and new passwords are required');
  }

  // ✅ FIX: password select karo
  const user = await User.findById(req.user?._id).select("+password");

  if (!user || !user.password) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await user.isPasswordCorrect(oldPassword);

  if (!isMatch) {
    throw new ApiError(400, 'Invalid old password');
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, 'Password changed successfully')
  );
});

/**
 * @desc Get current logged-in user
 * @route GET /api/users/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id; // ✅ already ObjectId

  const userWithDetails = await User.aggregate([
    {
      $match: { _id: userId },
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

  // ✅ User existence check
  if (!userWithDetails.length) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      userWithDetails[0],
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
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'User logged out successfully'))
})

/**
 * @desc Get all users with roles & schools
 * @route GET /api/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  let schoolId;
  const requesterRole = await getRequesterRoleName(req);

  if (requesterRole === "Super Admin") {
    schoolId = req.query.schoolId;
  } else {
    schoolId = req.user?.schoolId;
  }

  const {
    sort = "-createdAt",
    search = "",
    isActive,
    roleName,
    academicYearId,
    schoolClassId,
  } = req.query;

  /* -------------------- MATCH (BASE) -------------------- */
  const matchStage = {};

  // ✅ School filter
  if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
    matchStage.schoolId = new mongoose.Types.ObjectId(schoolId);
  }

  // ✅ Academic Year filter
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
    matchStage.academicYearId = new mongoose.Types.ObjectId(academicYearId);
  }

  // ✅ Class filter
  if (schoolClassId && mongoose.Types.ObjectId.isValid(schoolClassId)) {
    matchStage.schoolClassId = new mongoose.Types.ObjectId(schoolClassId);
  }

  // ✅ Active filter
  if (typeof isActive !== "undefined") {
    matchStage.isActive = isActive === "true";
  }

  // ✅ Search filter
  if (search) {
    matchStage.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { regId: { $regex: search, $options: "i" } },
    ];
  }

  /* -------------------- SORT -------------------- */
  const sortStage = {};
  sort.split(",").forEach((field) => {
    if (!field) return;
    const key = field.startsWith("-") ? field.slice(1) : field;
    sortStage[key] = field.startsWith("-") ? -1 : 1;
  });

  if (!Object.keys(sortStage).length) {
    sortStage.createdAt = -1;
  }

  /* -------------------- PIPELINE -------------------- */
  const pipeline = [
    { $match: matchStage },

    // ================= ROLE =================
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

    // ✅ ROLE FILTER (case-insensitive)
    ...(roleName
      ? [
          {
            $match: {
              "role.name": {
                $in: (Array.isArray(roleName)
                  ? roleName
                  : [roleName]
                ).map((r) => new RegExp(`^${r}$`, "i")), // 🔥 case-insensitive exact match
              },
            },
          },
        ]
      : []),

    // ================= SCHOOL =================
    {
      $lookup: {
        from: "schools",
        localField: "schoolId",
        foreignField: "_id",
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

    // ================= ACADEMIC YEAR =================
    {
      $lookup: {
        from: "academicyears",
        localField: "academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: { path: "$academicYear", preserveNullAndEmptyArrays: true } },

    // ================= CLASS =================
    {
      $lookup: {
        from: "schoolclasses",
        localField: "schoolClassId",
        foreignField: "_id",
        as: "class",
      },
    },
    { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },

    // ================= FINAL DATA =================
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
        },

        class: {
          _id: "$class._id",
          name: "$class.name",
        },
      },
    },

    { $sort: sortStage },
  ];

  const data = await User.aggregate(pipeline);

  return res.status(200).json({
    success: true,
    total: data.length,
    data,
  });
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

  const requesterRole = await getRequesterRoleName(req);
  const requesterSchoolId = req?.user?.schoolId;

  const userMatch = { _id: new mongoose.Types.ObjectId(id) };
  if (
    requesterRole !== "Super Admin" &&
    requesterSchoolId &&
    mongoose.Types.ObjectId.isValid(requesterSchoolId)
  ) {
    userMatch.schoolId = new mongoose.Types.ObjectId(requesterSchoolId);
  }

  const user = await User.aggregate([
    { $match: userMatch },

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


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, 'Refresh token is required');

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded?._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token expired or mismatched');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  return res
    .status(200)
    .cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
    .cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
    .json(new ApiResponse(200, { accessToken, refreshToken }, 'Access token refreshed successfully'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');

  const token = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = buildClientUrl(`/reset-password/${token}`);
  await sendEmail(user.email, 'Reset your password', `Reset your password using this link: ${resetUrl}`);

  return res.status(200).json(new ApiResponse(200, {}, 'Password reset link sent successfully'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token || !newPassword) throw new ApiError(400, 'Token and newPassword are required');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password reset successful'));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) throw new ApiError(400, 'Verification token is required');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: new Date() },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, 'Email verified successfully'));
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');

  if (user.isEmailVerified) {
    return res.status(200).json(new ApiResponse(200, {}, 'Email already verified'));
  }

  await sendVerificationEmail(user);

  return res.status(200).json(new ApiResponse(200, {}, 'Verification email sent successfully'));
});


const getMyPermissions = asyncHandler(async (req, res) => {
  const roleId = req?.user?.roleId?._id || req?.user?.roleId;
  if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) {
    throw new ApiError(400, 'User role is not assigned');
  }

  const role = await Role.findById(roleId).lean();
  if (!role) throw new ApiError(404, 'Role not found');

  return res.status(200).json(
    new ApiResponse(200, {
      role: {
        _id: role._id,
        name: role.name,
        code: role.code,
        level: role.level,
      },
      permissions: role.permissions || [],
    }, 'Permissions fetched successfully')
  );
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
  getUserById,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getMyPermissions
}
