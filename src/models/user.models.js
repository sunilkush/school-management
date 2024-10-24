import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
const userScheme = new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },role: { 
        type: String, 
        enum: ['student', 'teacher', 'admin'], 
        required: true 
    },profileId:{
        type:Schema.Types.ObjectId,
        refPath:"role"
    }
},{timestamps:true})

export const User = mongoose.model("User",userScheme)

// create password 
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

// password compare to login time method
userSchema.methods.isPasswordCorrect = async function(password) {
    // password compare
    return await bcrypt.compare(password, this.password)
}

