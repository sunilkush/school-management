import mongoose,{Schema} from "mongoose"

const eventSchema = new Schema({
    eventName:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    description:{
        type:String
    },
    attendees:[{
        type:Schema.Types.ObjectId,
        ref:"admission"
    }]
})

export const Event = mongoose.model("Event",eventSchema)