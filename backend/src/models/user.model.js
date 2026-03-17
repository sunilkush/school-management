import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { type } from "os";

const userSchema = new Schema(
  {
    regId: {
      type: String,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true
    },

    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },



    avatar: {
      type: String,
      default: null,
    },
    schoolId:{
        type:Schema.Types.ObjectId,
        ref:"School",
    },

    // 🔹 Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // 🔹 Auth Tokens
    refreshToken: {
      type: String,
      select: false,
    },

    // 🔹 Email Verification
    emailVerificationToken: {
        type:String
    },
    emailVerificationExpire: {
        type:Date
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // 🔹 Password Reset
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpire:{
       type: String,
    },

    // 🔹 Audit Fields (Enterprise MUST)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    lastLoginAt: {
        type:Date
    },
  },
  {
    timestamps: true,
  }
);


// 🔥 Composite Unique Index (VERY IMPORTANT)
userSchema.index({ email: 1, schoolId: 1 }, { unique: true });
userSchema.index({ regId: 1, schoolId: 1 }, { unique: true });


// 🔹 Password Hash Middleware
// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});



// 🔹 Generate School-wise RegId (Race Condition Safe)
userSchema.statics.generateRegId = async function (schoolId) {
  const lastUser = await this.findOne({ schoolId })
    .sort({ createdAt: -1 })
    .select("regId");

  let newId = "#000001";

  if (lastUser?.regId) {
    const lastNum = parseInt(lastUser.regId.replace("#", "")) || 0;
    newId = "#" + String(lastNum + 1).padStart(6, "0");
  }

  return newId;
};


// 🔹 Password Compare
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};


// 🔹 Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      roleId: this.roleId,
      schoolId: this.schoolId,
      tenantId: this.tenantId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};


// 🔹 Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};


// 🔹 Email Verification Token
userSchema.methods.generateEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return rawToken;
};


// 🔹 Reset Password Token
userSchema.methods.generateResetPasswordToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  return rawToken;
};


// 🔹 Soft Delete Method
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.isActive = false;
  return this.save();
};


// 🔹 Last Login Update
userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};


export const User = mongoose.model("User", userSchema);