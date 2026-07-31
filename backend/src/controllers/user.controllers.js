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
import { Student } from '../models/student.model.js'
import { StudentEnrollment } from '../models/StudentEnrollment.model.js'
import { Employee } from '../models/Employee.model.js'
import { Teacher } from '../models/teacherAssignment.model.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { SchoolSubscription } from '../models/schoolSubscription.model.js'
import { recordLoginEvent, recordLogoutByUserId } from './loginLog.controllers.js'
// ✅ Generate Access & Refresh Token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId, isActive: true, isDeleted: { $ne: true } })
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

  const verifyUrl = buildClientUrl(`/verify-email?token=${token}`);
  try {
    await sendEmail(
      user.email,
      'Verify your email — School Management',
      `Hi ${user.name},\n\nPlease verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, please ignore this email.`
    );
  } catch (err) {
    console.error("Verification email failed (non-fatal):", err.message);
  }
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
// Not every user in a school has a "#NNNNNN"-style regId — seeded employees get human-readable
// codes like "TCH001"/"STF001" instead. Picking whichever user was created *last* (regardless
// of its regId's format) meant that whenever that happened to be one of those, parseInt() on it
// produced NaN -> 0, silently resetting the counter back to "#000001" and colliding with an
// already-used id. Scanning for the true max among "#NNNNNN"-format regIds fixes that.
export const generateNextRegId = async (schoolId) => {
  const users = await User.find({ schoolId, regId: { $regex: /^#\d{6}$/ } })
    .select("regId")
    .lean();

  const maxNum = users.reduce((max, u) => {
    const n = parseInt(u.regId.slice(1), 10);
    return n > max ? n : max;
  }, 0);

  return "#" + String(maxNum + 1).padStart(6, "0");
};
/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Private (Only Super Admin & School Admin)
 */
// ✅ Register User Controller
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, schoolClassId, parentId, isActive } = req.body;
  // Caller's school must come from the token; only Super Admin can target a different school
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? req.body.schoolId : req.user.schoolId;

  if (!name || !email || !password || !roleId || !schoolId) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // ✅ Check Academic Year
  let academicYearId = null;
  const activeAcademicYear = await AcademicYear.findOne({
    schoolId,
    $or: [{ isActive: true }, { status: "active" }],
  });
  if (activeAcademicYear) {
    academicYearId = activeAcademicYear._id;
  }

  // ✅ Email exists check — scoped to the same school to avoid cross-school collisions
  const existingUser = await User.findOne({ email, schoolId });
  if (existingUser) {
    if (!existingUser.isActive) {
      // ✅ Reactivate user
      existingUser.isActive = true;
      existingUser.name = req.body.name || existingUser.name;

      await existingUser.save();

      // Was returning a raw {message, user} body — every other branch of this handler (and the
      // callers on both web/authSlice.js and mobile/CreateUserView.jsx) reads the created user via
      // response.data.data, which this shape never had, so re-registering a deactivated user's
      // email crashed step 2 (employee creation) with "Cannot read properties of undefined".
      return res
        .status(200)
        .json(new ApiResponse(200, existingUser, "User re-activated successfully"));
    }

    // ❌ Already active
    throw new ApiError(400, "User already exists");
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
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // 1️⃣ Find user
  const user = await User.findOne({ email, isActive: true, isDeleted: { $ne: true } })
    .select("+password")
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

  // 4b️⃣ Subscription check for school-level roles
  let subscriptionWarning = null;
  if (!isSuperAdmin && user.schoolId?._id) {
    const sub = await SchoolSubscription.findOne({ schoolId: user.schoolId._id }).lean();
    if (sub) {
      const now = new Date();
      const end = new Date(sub.endDate);
      const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

      if (sub.status === "expired" || daysLeft <= 0) {
        throw new ApiError(
          403,
          `Your school's subscription has expired on ${end.toLocaleDateString("en-IN")}. Please contact the administrator to renew.`
        );
      }

      if (daysLeft <= 30) {
        subscriptionWarning = {
          daysLeft,
          endDate: sub.endDate,
          planId: sub.planId,
        };
      }
    }
  }

  // 5️⃣ Check if 2FA is required
  if (user.twoFactorEnabled) {
    // Send OTP email for 2FA step
    const { OTP } = await import("../models/otpVerifications.model.js");
    const { sendEmail } = await import("../utils/mailServices.js");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OTP.findOneAndUpdate(
      { emailOrPhone: user.email, purpose: "login" },
      { code, expiresAt, verifiedAt: null },
      { upsert: true, new: true }
    );
    await sendEmail(user.email, "Login OTP — School Management", `Your login OTP is: ${code}\n\nExpires in 10 minutes.`);
    return res.status(200).json(new ApiResponse(200, {
      requiresTwoFactor: true,
      userId: user._id,
    }, "2FA required. OTP sent to your email."));
  }

  // 5️⃣ Tokens
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user._id);

  // 6️⃣ Aggregation for frontend-ready user
  const userWithDetails = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(user._id),
        isActive: true,
        isDeleted: { $ne: true },
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
        from: "roles",
        localField: "additionalRoles",
        foreignField: "_id",
        as: "additionalRolesData",
      },
    },

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
        phone: 1,
        avatar: 1,
        isActive: 1,

        role: {
          _id: "$role._id",
          name: "$role.name",
          permissions: "$role.permissions",
        },

        additionalRoles: {
          $map: {
            input: "$additionalRolesData",
            as: "ar",
            in: { _id: "$$ar._id", name: "$$ar.name" },
          },
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

  // 7️⃣ Record login event asynchronously (non-blocking)
  recordLoginEvent({
    userId: user._id,
    schoolId: user.schoolId?._id || user.schoolId,
    userRole: user.roleId?.name || "Unknown",
    academicYearId: user.academicYearId,
    req,
    status: "success",
  });

  // 8️⃣ Response
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
          subscriptionWarning,
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
  const {
    name, email, phone,
    gender, dateOfBirth, address, joiningDate, qualification,
    emergencyContactName, emergencyContactPhone,
    departmentId, designationId,
  } = req.body
  if (!name || !email) throw new ApiError(400, 'Name and email are required')

  const user = await User.findOne({ _id: req.user?._id, isActive: true, isDeleted: { $ne: true } })
  if (!user) throw new ApiError(404, 'User not found')

  user.name  = name
  user.email = email
  if (phone !== undefined) user.phone = phone

  // Employee fields — save if provided
  if (gender             !== undefined) user.gender               = gender
  if (dateOfBirth        !== undefined) user.dateOfBirth          = dateOfBirth || null
  if (address            !== undefined) user.address              = address
  if (joiningDate        !== undefined) user.joiningDate          = joiningDate || null
  if (qualification      !== undefined) user.qualification        = qualification
  if (emergencyContactName  !== undefined) user.emergencyContactName  = emergencyContactName
  if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone
  if (departmentId       !== undefined) user.departmentId         = departmentId || null
  if (designationId      !== undefined) user.designationId        = designationId || null

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  if (avatarLocalPath) {
    const uploaded = await uploadOnCloudinary(avatarLocalPath)
    if (uploaded?.secure_url) user.avatar = uploaded.secure_url
  }

  await user.save()

  // Re-fetch with all populated fields so frontend state stays complete
  const updated = await User.findById(user._id)
    .select('-password -refreshToken')
    .populate('roleId',        'name permissions')
    .populate('schoolId',      'name isActive')
    .populate('departmentId',  'name code')
    .populate('designationId', 'title level')
    .lean()

  const result = {
    ...updated,
    role:        updated.roleId        || null,
    school:      updated.schoolId      || null,
    department:  updated.departmentId  || null,
    designation: updated.designationId || null,
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'User updated successfully'))
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
  const user = await User.findOne({ _id: req.user?._id, isActive: true, isDeleted: { $ne: true } }).select("+password");

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
      $match: { _id: userId, isActive: true, isDeleted: { $ne: true } },
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

    // ===== DEPARTMENT =====
    {
      $lookup: {
        from: "departments",
        localField: "departmentId",
        foreignField: "_id",
        as: "department",
      },
    },
    { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },

    // ===== DESIGNATION =====
    {
      $lookup: {
        from: "designations",
        localField: "designationId",
        foreignField: "_id",
        as: "designation",
      },
    },
    { $unwind: { path: "$designation", preserveNullAndEmptyArrays: true } },

    // ===== PROJECTION =====
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        avatar: 1,
        isActive: 1,
        regId: 1,
        createdAt: 1,

        // Employee fields
        gender: 1,
        dateOfBirth: 1,
        address: 1,
        joiningDate: 1,
        qualification: 1,
        emergencyContactName: 1,
        emergencyContactPhone: 1,

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

        department: {
          _id: "$department._id",
          name: "$department.name",
          code: "$department.code",
        },

        designation: {
          _id: "$designation._id",
          title: "$designation.title",
          level: "$designation.level",
        },

        additionalRoles: 1,
      },
    },

    // Populate additionalRoles with name
    {
      $lookup: {
        from: "roles",
        localField: "additionalRoles",
        foreignField: "_id",
        as: "additionalRolesData",
      },
    },
    {
      $addFields: {
        additionalRoles: {
          $map: {
            input: "$additionalRolesData",
            as: "ar",
            in: { _id: "$$ar._id", name: "$$ar.name" },
          },
        },
      },
    },
    { $unset: "additionalRolesData" },
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
  recordLogoutByUserId(req.user._id);
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
    page = 1,
    // UserRoleList.jsx (Super Admin's Teachers/Staff/Students/Parents/Accountants/Librarians
    // pages) intentionally loads the whole role-scoped result set for client-side search/stats,
    // so this stays generous rather than a tight page size — the cap exists purely so this query
    // can never return the *entire* platform's users unbounded as school count grows.
    limit = 2000,
  } = req.query;
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 2000, 1), 5000);
  const skip = (pageNumber - 1) * limitNumber;

  /* -------------------- MATCH (BASE) -------------------- */
  const matchStage = {};

  // ✅ School filter
  if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
    matchStage.schoolId = new mongoose.Types.ObjectId(schoolId);
  }

  // ✅ Academic Year filter
  // For Parents: resolve through StudentEnrollment → Student to get valid parent IDs
  const roleNames = roleName ? (Array.isArray(roleName) ? roleName : [roleName]).map(r => r.toLowerCase()) : [];
  const isParentQuery = roleNames.includes("parent");

  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
    if (isParentQuery) {
      const ayObjId = new mongoose.Types.ObjectId(academicYearId);
      const enrollFilter = { academicYearId: ayObjId };
      if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
        enrollFilter.schoolId = new mongoose.Types.ObjectId(schoolId);
      }
      const enrollments = await StudentEnrollment.find(enrollFilter).select("studentId").lean();
      const studentIds = enrollments.map(e => e.studentId);
      const studentProfiles = await Student.find({ _id: { $in: studentIds } }).select("fatherId motherId guardianId").lean();
      const parentIds = [];
      studentProfiles.forEach(s => {
        if (s.fatherId) parentIds.push(s.fatherId);
        if (s.motherId) parentIds.push(s.motherId);
        if (s.guardianId) parentIds.push(s.guardianId);
      });
      const uniqueParentIds = [...new Map(parentIds.map(id => [id.toString(), id])).values()];
      matchStage._id = { $in: uniqueParentIds };
    } else {
      matchStage.academicYearId = new mongoose.Types.ObjectId(academicYearId);
    }
  }

  // ✅ Class filter
  if (schoolClassId && mongoose.Types.ObjectId.isValid(schoolClassId)) {
    matchStage.schoolClassId = new mongoose.Types.ObjectId(schoolClassId);
  }

 // ✅ Active filter: defaults to active-only, but callers that explicitly pass isActive=false
  // (e.g. a "show deactivated users" toggle) need that honored — otherwise a deactivated user
  // vanishes from every list with no way to find and reactivate them. deleteUser() sets both
  // isActive:false and isDeleted:true together (they're not independent here), so isDeleted must
  // relax in lockstep or the isActive=false request would still match nothing.
  const wantsInactive = isActive === "false" || isActive === false;
  matchStage.isActive = wantsInactive ? false : true;
  if (!wantsInactive) {
    matchStage.isDeleted = { $ne: true };
  }

  // ✅ Search filter
  if (search) {
    const safeSearch = escapeRegex(search);
    matchStage.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
      { regId: { $regex: safeSearch, $options: "i" } },
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
                ).map((r) => new RegExp(`^${escapeRegex(r)}$`, "i")), // 🔥 case-insensitive exact match
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
        phone: 1,
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
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limitNumber }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await User.aggregate(pipeline);
  const data = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return res.status(200).json({
    success: true,
    total,
    data,
    pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
  });
});

/**
 * @desc Deactivate user
 * @route DELETE /api/users/:id
 */
const toggleLinkedUserDetails = async (userId, isActive) => {
  const studentStatus = isActive ? "active" : "inactive";
  const teacherStatus = isActive ? "active" : "inactive";

  const [studentResult, employeeResult, teacherResult] = await Promise.all([
    Student.updateMany(
      { userId },
      { $set: { isActive, status: studentStatus } }
    ),
    Employee.updateMany(
      { userId },
      { $set: { isActive } }
    ),
    Teacher.updateMany(
      { teacherId: userId },
      { $set: { status: teacherStatus } }
    ),
  ]);

  return {
    students: studentResult.modifiedCount || 0,
    employees: employeeResult.modifiedCount || 0,
    teacherAssignments: teacherResult.modifiedCount || 0,
  };
};

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Valid User ID is required');
  }

  // Scope to the caller's own school unless they're Super Admin — otherwise a School Admin could
  // deactivate a user in a different tenant just by knowing/guessing their ObjectId.
  const isSuperAdmin = (req.userRole?.name || req.user?.roleId?.name) === 'Super Admin';
  const match = { _id: id };
  if (!isSuperAdmin) {
    match.schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  }

  const user = await User.findOneAndUpdate(
    match,
    { isActive: false, isDeleted: true },
    { new: true }
  ).select('-password -refreshToken -emailVerificationToken -resetPasswordToken');

  if (!user) throw new ApiError(404, 'User not found');

  const linkedRecords = await toggleLinkedUserDetails(user._id, false);
  const userWithLinkedSummary = { ...user.toObject(), linkedRecords };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userWithLinkedSummary,
        'User and linked details deactivated successfully'
      )
    );
});


/**
 * @desc Admin update any user's profile in their school
 * @route PATCH /api/v1/user/admin-update/:id
 */
const adminUpdateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Valid User ID is required");
  }

  const adminSchoolId = req.user?.schoolId;
  const match = {
    _id: new mongoose.Types.ObjectId(id),
    isActive: true,
    isDeleted: { $ne: true },
  };
  if (adminSchoolId && mongoose.Types.ObjectId.isValid(adminSchoolId)) {
    match.schoolId = new mongoose.Types.ObjectId(adminSchoolId);
  }

  const user = await User.findOne(match);
  if (!user) throw new ApiError(404, "User not found in your school");

  const {
    name, email, phone,
    gender, dateOfBirth, address, joiningDate, qualification,
    emergencyContactName, emergencyContactPhone,
    departmentId, designationId,
  } = req.body;

  if (name  !== undefined) user.name  = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (gender             !== undefined) user.gender               = gender;
  if (dateOfBirth        !== undefined) user.dateOfBirth          = dateOfBirth  || null;
  if (address            !== undefined) user.address              = address;
  if (joiningDate        !== undefined) user.joiningDate          = joiningDate  || null;
  if (qualification      !== undefined) user.qualification        = qualification;
  if (emergencyContactName  !== undefined) user.emergencyContactName  = emergencyContactName;
  if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone;
  if (departmentId       !== undefined) user.departmentId         = departmentId  || null;
  if (designationId      !== undefined) user.designationId        = designationId || null;

  await user.save();

  const updated = await User.findById(user._id)
    .select("-password -refreshToken")
    .populate("roleId",        "name")
    .populate("schoolId",      "name")
    .populate("departmentId",  "name code")
    .populate("designationId", "title level")
    .lean();

  return res.status(200).json(new ApiResponse(200, updated, "User profile updated successfully"));
});

/**
 * @desc Activate user
 * @route PATCH /api/users/:id/activate
 */
const activeUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Valid User ID is required');
  }

  // Scope to the caller's own school unless they're Super Admin — same tenant-isolation gap as
  // deleteUser above, applied to reactivation.
  const isSuperAdmin = (req.userRole?.name || req.user?.roleId?.name) === 'Super Admin';
  const match = { _id: id };
  if (!isSuperAdmin) {
    match.schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  }

  const user = await User.findOneAndUpdate(
    match,
    { isActive: true, isDeleted: false },
    { new: true }
  ).select('-password -refreshToken -emailVerificationToken -resetPasswordToken');

  if (!user) throw new ApiError(404, 'User not found');

  const linkedRecords = await toggleLinkedUserDetails(user._id, true);
  const userWithLinkedSummary = { ...user.toObject(), linkedRecords };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userWithLinkedSummary,
        'User and linked details activated successfully'
      )
    );
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params // using query ?id=

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Valid User ID is required");
  }

  const requesterRole = await getRequesterRoleName(req);
  const requesterSchoolId = req?.user?.schoolId;

  const userMatch = {
    _id: new mongoose.Types.ObjectId(id),
    isActive: true,
    isDeleted: { $ne: true },
  };
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

    // Join Department
    {
      $lookup: {
        from: "departments",
        localField: "departmentId",
        foreignField: "_id",
        as: "department",
      },
    },
    { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },

    // Join Designation
    {
      $lookup: {
        from: "designations",
        localField: "designationId",
        foreignField: "_id",
        as: "designation",
      },
    },
    { $unwind: { path: "$designation", preserveNullAndEmptyArrays: true } },

    // Projection
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        avatar: 1,
        isActive: 1,
        regId: 1,
        gender: 1,
        dateOfBirth: 1,
        address: 1,
        joiningDate: 1,
        qualification: 1,
        emergencyContactName: 1,
        emergencyContactPhone: 1,
        createdAt: 1,
        additionalRoles: 1,

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
        department: {
          _id: "$department._id",
          name: "$department.name",
          code: "$department.code",
        },
        designation: {
          _id: "$designation._id",
          title: "$designation.title",
          level: "$designation.level",
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

  const user = await User.findOne({ _id: decoded?._id, isActive: true, isDeleted: { $ne: true } }).select("+refreshToken");
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

  // Always return the same generic response whether or not this email is registered — a 404 for
  // "unknown" vs 200 for "known" lets an attacker enumerate real accounts by trying addresses.
  const genericResponse = () =>
    res.status(200).json(new ApiResponse(200, {}, 'If an account exists for this email, a password reset link has been sent'));

  const user = await User.findOne({ email, isActive: true, isDeleted: { $ne: true } });
  if (!user) return genericResponse();

  const token = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = buildClientUrl(`/reset-password?token=${token}`);
  await sendEmail(
    user.email,
    'Reset your password — School Management',
    `Hi ${user.name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`
  );

  return genericResponse();
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const newPassword = req.body.newPassword || req.body.password;

  if (!token || !newPassword) throw new ApiError(400, 'Token and password are required');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() },
    isActive: true,
    isDeleted: { $ne: true },
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
    isActive: true,
    isDeleted: { $ne: true },
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

 const user = await User.findOne({ email, isActive: true, isDeleted: { $ne: true } });
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

/**
 * @desc  Assign or update additional roles for a user (admin only)
 * @route PATCH /api/users/assign-additional-roles/:id
 * @body  { additionalRoleIds: string[] }
 */
const assignAdditionalRoles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { additionalRoleIds = [] } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const isSuperAdmin = (req.userRole?.name || req.user?.roleId?.name) === "Super Admin";

  // A School Admin has no business touching a user outside their own tenant — scope the lookup
  // unless the caller is already Super Admin.
  const userQuery = { _id: id, isActive: true, isDeleted: { $ne: true } };
  if (!isSuperAdmin) {
    userQuery.schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  }
  const user = await User.findOne(userQuery);
  if (!user) throw new ApiError(404, "User not found");

  // Validate every supplied role ID actually exists
  if (additionalRoleIds.length > 0) {
    const validRoles = await Role.find({ _id: { $in: additionalRoleIds } }).select("_id name type level").lean();
    if (validRoles.length !== additionalRoleIds.length) {
      throw new ApiError(400, "One or more role IDs are invalid");
    }

    // Only Super Admin may grant a system role (currently just "Super Admin" itself) or any role
    // at a more senior tier than their own — otherwise a School Admin could hand themselves (or
    // anyone) platform-admin access through this endpoint.
    if (!isSuperAdmin) {
      const callerRoleId = req.user?.roleId?._id || req.user?.roleId;
      const callerRole = await Role.findById(callerRoleId).select("level").lean();
      const callerLevel = callerRole?.level ?? 4;
      const forbidden = validRoles.find((r) => r.type === "system" || (r.level ?? 4) < callerLevel);
      if (forbidden) {
        throw new ApiError(403, `Not allowed to assign role "${forbidden.name}"`);
      }
    }

    // Prevent assigning primary role as additional role
    const primaryId = user.roleId.toString();
    if (additionalRoleIds.map(String).includes(primaryId)) {
      throw new ApiError(400, "Cannot assign primary role as an additional role");
    }
  }

  user.additionalRoles = additionalRoleIds;
  await user.save();

  const updated = await User.findById(user._id)
    .select("-password -refreshToken")
    .populate("roleId", "name")
    .populate("additionalRoles", "name")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      _id: updated._id,
      name: updated.name,
      role: updated.roleId,
      additionalRoles: updated.additionalRoles,
    }, "Additional roles updated successfully")
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
  getMyPermissions,
  assignAdditionalRoles,
  adminUpdateUser,
}
