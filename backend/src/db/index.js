import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";
import dotenv from "dotenv"
dotenv.config();

const dbConnection = async()=>{
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`);
            console.log(`mongoDB database connect : ${connectInstance.connection.host}`)
    } catch (error) {
        console.log(`Database Doesn't Connect`)
    }
}

export default dbConnection
//mongodb+srv://Sunil_Kush:OebG8R7RVVcCrZGn@cluster0.xxwzkn3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0