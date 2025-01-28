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
    classes: {
        type:String,
       
        required: true
    },
    section: {
        type: String,
        required: true
    },
    parent: {
        type:String,
        required:true
    },
    address: { 
        type: String 
    },
    dateOfBirth: { 
        type: Date 
    },
}, { timestamps: true });

export const Student = mongoose.model("Students",studentSchema)