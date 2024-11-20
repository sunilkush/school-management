import mongoose from "mongoose";

const transportSchema = new Schema({
   routeName:{
    type:String,
    required:true
   },
   busNumber:{
    type:String,
    required:true
   },
   driverName:{
    type:String,
    required:true
   },
   capacity:{
    type:Number,
    required:true
   },
   students:[
    {
        type: Schema.Types.ObjectId,
        ref:"Student"
    }
   ]
},{ timestamps: true })

export const Transport = mongoose.model("Transports",transportSchema)
