import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv"
import { ApiError } from "./ApiError.js";
import fs from "fs"

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_SECRET,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return ApiError(401, "Something went wrong")
        }
        const response = await cloudinary.uploader.upload(localFilePath)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return error
    }
}

const deleteOnCloudinary = async (localFilePath) => {
    try {
       if(!localFilePath){
        return ApiError(400,"!File Not Found")
       }
       const response = await cloudinary.uploader.destroy(localFilePath)
       return response

    } catch (error) {
        return ApiError(401,"Unauthorized ")
    }

}



export {
    uploadOnCloudinary,
    deleteOnCloudinary
}