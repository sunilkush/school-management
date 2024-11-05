import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
const userScheme = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }, role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true
    }, profileId: {
        type: Schema.Types.ObjectId,
        refPath: "role",
       
    }
}, { timestamps: true })

export const User = mongoose.model("User", userScheme)

// create password 
userSchema.pre('save', async function (next) {
    // step 2
    if (!this.isModified('password')) return next();
    // step 1

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// password compare to login time method
userSchema.methods.isPasswordCorrect = async function (password) {
    // password compare
    return await bcrypt.compare(password, this.password)
}

// Generate Access Token

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}

// Generate Request Token

userSchema.methods.generateRequestToken = function () {
    return jwt.sign({
        _id: this._id
    },
        process.env.REQUEST_TOKEN_SECRET,
        {
            expiresIn: process.env.REQUEST_TOKEN_EXPIRY
        }
    )
}


