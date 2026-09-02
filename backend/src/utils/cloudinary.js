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

/**
 * Deletes an asset by its Cloudinary public_id. Mirrors uploadOnCloudinary's contract: returns
 * null on any failure rather than throwing, so a cleanup step can never take down the request
 * that triggered it.
 */
const deleteOnCloudinary = async (publicId) => {
    // Both branches below previously did `return ApiError(...)` — but ApiError is a *class*, and
    // calling a class without `new` throws "Class constructor ApiError cannot be invoked without
    // 'new'". So a missing id raised a confusing TypeError instead of an error object, and the
    // catch block did the same thing again, replacing whatever the real Cloudinary failure was
    // with that TypeError and losing it entirely.
    if (!publicId) {
        console.error("Cloudinary Delete Error: no public_id supplied")
        return null
    }
    try {
        return await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.error("Cloudinary Delete Error:", error)
        return null
    }
}



export {
    uploadOnCloudinary,
    deleteOnCloudinary
}
