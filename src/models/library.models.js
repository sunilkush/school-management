import mongoose,{Schema} from "mongoose";

const bookSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    author:{
        type:String,
        required:true,
    },
    isbn:{
        type:String,
        required:true,
        unique:true
    },
    status:{
        type:String,
        enum:["Available","Issued"],
        default:"Available"
    },
    issuedTo:{
        type:Schema.Types.ObjectId,
        ref:"Student",
        default:null
    }
},{timestamps: true})

export const Book = mongoose.model("Book", bookSchema)