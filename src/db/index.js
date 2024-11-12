import mongoose from "mongoose";
import {db_name} from "../constants.js";


const dbConnection = async()=>{
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`);
            console.log(`mongoDB database connect : ${connectInstance.connection.host}`)
    } catch (error) {
        console.log(`Database Doesn't Connect`)
    }
}

export default dbConnection