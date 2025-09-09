import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
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
    avatar: {
        type: String,
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "School",
          required: true,
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },  // If the user is a student, link their parent
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String
    },
     accessToken: {
        type: String
    },
    

    
}, { timestamps: true }
);

// password bcrypt


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})
// password compare to login time method
userSchema.methods.isPasswordCorrect = async function (password) {
    // password compare

    return await bcrypt.compare(password, this.password)
}
// create access token method
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name,
        roleId: this.roleId


    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}
// create request token method
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id

    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })
}

export const User = mongoose.model("User", userSchema)
