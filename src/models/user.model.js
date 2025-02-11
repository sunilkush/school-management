import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "teacher", "student", "parent"],
        required: true,
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "School"
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: "Classes"
    },  // For students & teachers
    parentId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },  // If the user is a student, link their parent

}, { timestamps: true });

// password bcrypt

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
});
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
        role: this.role,

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

export const User = mongoose.model("Users", userSchema)