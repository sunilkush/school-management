import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv"
import { ApiError } from "./ApiError.js";
import fs from "fs"

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) {
            throw new ApiError(400, "localpath Required !")
        }
        const result = await cloudinary.uploader.upload(filePath);
        fs.unlinkSync(filePath)
        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};

const deleteOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return ApiError(400, "!File Not Found")
        }
        const response = await cloudinary.uploader.destroy(localFilePath)
        return response

    } catch (error) {
        return ApiError(401, "Unauthorized ")
    }

}



export {
    uploadOnCloudinary,
    deleteOnCloudinary
}
