import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new Schema({
    regId: {            // 👈 naya field (Registration ID)
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    roleId: {
        type: Schema.Types.ObjectId,
        ref: "Role",
        required: true,
    },
    avatar: String,
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "School",
        required: true,
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isActive: {
        type: Boolean,
        default: true
    },
   
    refreshToken: String,
    accessToken: String,
}, { timestamps: true });

// 🔹 Password Hash
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);

    // 🔹 Generate regId school-wise
    if (!this.regId && this.schoolId) {
        const lastUser = await mongoose.model("User")
            .findOne({ schoolId: this.schoolId })
            .sort({ createdAt: -1 });

        let newId = "#000001"; // default for first user
        if (lastUser && lastUser.regId) {
            const lastNum = parseInt(lastUser.regId.replace("#", "")) || 0;
            newId = "#" + String(lastNum + 1).padStart(6, "0");
        }

        this.regId = newId;
    }

    next();
});

// 🔹 Compare Password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// 🔹 Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name,
        roleId: this.roleId
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
};

// 🔹 Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
};

export const User = mongoose.model("User", userSchema);
