import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler";

const studentUpdate = asyncHandler(async (req, res) => {
    const { phoneNumber, dateOfBirth, gender, address, enrollmentNumber, guardian, admissionDate } = req.body

    if ([phoneNumber, dateOfBirth, gender, address, enrollmentNumber, guardian, admissionDate].some((fields) => fields?.trim() === "")){
        throw new ApiError(400,"")
    }
})

export {
    studentUpdate
}