import mongoose,{Schema} from "mongoose";

const serviceRequestSchema = new Schema({
    requestType:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    studentId:{
        type:Schema.Types.ObjectId,
        ref:"Student"
    },
    status:{
        type:String,
        enum:["pending","In Progress","Completed"],
        default:"pending"
    }
},{timestamps:true})

export const ServiceRequest = mongoose.model("ServiceRequest",serviceRequestSchema)

const inventorySchema = new Schema({
    itemName:{
        type:String,
        required:true
    },
    quantity:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:["Available","out of Stock"],
        default:"Available"
    }
},{timestamps:true})

export const Inventory = mongoose.model("Inventory",inventorySchema)