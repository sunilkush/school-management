import mongoose, { Schema } from "mongoose";

const alumniSchema = new Schema({
    studentId:{
        type:Schema.Types.ObjectId,
        ref:"Student",
        required:true,
    },
    graduationYear:{
      type:Number,
      required:true
    },
    currentOccupation:{
        type:String,
        required:true
    },
    contactInfo:{
       type:String,
       required:true
    }
})

export const Alumni = mongoose.model("Alumni",alumniSchema)