import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "teacher", "student", "parent"],
        required: true
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "School"
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: "Class"
    },  // For students & teachers
    parentId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },  // If the user is a student, link their parent

}, { timestamps: true })
export const User = mongoose.model("Users", userSchema)