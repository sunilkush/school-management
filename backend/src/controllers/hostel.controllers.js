import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Hostel } from "../models/hostel.model.js";
import { User } from "../models/user.model.js";
import { School } from "../models/school.model.js";

// ✅ Create Hostel Entry (Assign Student to Hostel Room)
const createHostel = asyncHandler(async (req, res) => {
    const { schoolId, studentId, roomNumber, status } = req.body;

    // Validation for required fields
    if (![schoolId, studentId, roomNumber, status].every(Boolean)) {
        throw new ApiError(400, "All fields are required!");
    }

    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
        throw new ApiError(404, "School not found!");
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
        throw new ApiError(404, "Student not found!");
    }

    // Check if the student is already assigned to a hostel
    const existingHostelEntry = await Hostel.findOne({ studentId });
    if (existingHostelEntry) {
        throw new ApiError(400, "Student is already assigned to a hostel room!");
    }

    // Create hostel entry
    const hostel = await Hostel.create({ schoolId, studentId, roomNumber, status });

    if (!hostel) {
        throw new ApiError(400, "Hostel assignment failed!");
    }

    return res.status(201).json(
        new ApiResponse(201, hostel, "Student assigned to hostel successfully!")
    );
});

// ✅ Get All Hostel Entries with Pagination, Filtering & Sorting
const getHostels = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sortBy = "createdAt", order = "desc", status, schoolId } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { roomNumber: { $regex: search, $options: "i" } }
            ];
        }
        if (status) query.status = status;
        if (schoolId) query.schoolId = schoolId;

        const hostels = await Hostel.find(query)
            .populate("schoolId", "name")
            .populate("studentId", "name email")
            .sort({ [sortBy]: order === "desc" ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Hostel.countDocuments(query);

        res.json(new ApiResponse(200, { total, page, hostels }, "Hostel records retrieved successfully"));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Get Single Hostel Entry by ID
const getHostelById = asyncHandler(async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id)
            .populate("schoolId", "name")
            .populate("studentId", "name email");

        if (!hostel) {
            throw new ApiError(404, "Hostel entry not found!");
        }

        res.json(new ApiResponse(200, hostel, "Hostel record retrieved successfully"));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Update Hostel Entry
const updateHostel = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { roomNumber, status } = req.body;

        const hostel = await Hostel.findById(id);
        if (!hostel) {
            throw new ApiError(404, "Hostel entry not found!");
        }

        if (roomNumber) hostel.roomNumber = roomNumber;
        if (status) hostel.status = status;

        const updatedHostel = await hostel.save();

        res.json(new ApiResponse(200, updatedHostel, "Hostel record updated successfully"));
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ✅ Delete Hostel Entry
const deleteHostel = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const deletedHostel = await Hostel.findByIdAndDelete(id);
        if (!deletedHostel) {
            throw new ApiError(404, "Hostel entry not found!");
        }

        res.json(new ApiResponse(200, null, "Hostel record deleted successfully"));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export {
    createHostel,
    getHostels,
    getHostelById,
    updateHostel,
    deleteHostel
};
