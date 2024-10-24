import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv"
import { ApiError } from "./ApiError";
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

export {
    uploadOnCloudinary
}