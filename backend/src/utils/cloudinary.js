import { v2 as cloudinary } from "cloudinary";

import { ApiError } from "./ApiError.js";
import fs from "fs"
import dotenv from "dotenv"
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
        // "image" rejected every non-image upload outright (Cloudinary errors, this function's
        // own catch swallows it and returns null) — multer.middleware.js's ALLOWED_MIME_TYPES
        // explicitly allows PDF/Word/Excel too, and studyMaterial.controllers.js uses this same
        // helper for exactly those, so every non-image study material silently saved with no
        // file at all. "auto" detects image/video/raw correctly and still handles plain images.
        const result = await cloudinary.uploader.upload(filePath,{
            resource_type: "auto",
        });
        fs.unlinkSync(filePath)
        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        // Previously only cleaned up the local temp file on success — a failed upload (bad
        // credentials, network error, wrong resource_type for the file, ...) left it sitting in
        // the temp upload directory indefinitely.
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch { /* best-effort cleanup */ }
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
