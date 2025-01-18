import mongoose,{Schema} from "mongoose";

const studentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rollNumber: {
        type: String,
        required: true
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: "Class",
        required: true
    },
    section: {
        type: String,
        required: true
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }, // Parent's User reference
    address: { 
        type: String 
    },
    dateOfBirth: { 
        type: Date 
    },
}, { timestamps: true });

export const Student = mongoose.model("Students",studentSchema)