import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Employee } from "../models/Employee.model.js";

// ✅ Create Employee
const createEmployee = asyncHandler(async (req, res) => {
    const { name, email, password, role, schoolId, phoneNo, gender, dateOfBirth, address, department, designation, joinDate,
        employmentType, salary, assignedClasses, status } = req.body;

    if ([name, email, password, role, schoolId, phoneNo, gender, dateOfBirth, address, department, designation, joinDate,
        employmentType, salary, assignedClasses, status].some((field) => typeof field === "string" && field.trim() === "" || field == null)) {
        throw new ApiError(400, "All fields are required!");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(400, "User already registered!");
    }

    const newUser = await User.create({
        name, email, password, role, schoolId
    });

    if (!newUser) {
        throw new ApiError(400, "User creation failed!");
    }

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    const employee = await Employee.create({
        userId: createdUser._id,
        phoneNo, gender, dateOfBirth, address, department, designation, joinDate,
        employmentType, salary, assignedClasses, status
    });

    if (!employee) {
        throw new ApiError(404, "Employee creation failed!");
    }

    return res.status(201).json(
        new ApiResponse(201, { createdUser, employee }, "Employee created successfully!")
    );
});

// ✅ Get All Employees with Pagination, Filtering, and Sorting
const getEmployees = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sortBy = "createdAt", order = "desc", department, status } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { phoneNo: { $regex: search, $options: "i" } },
                { department: { $regex: search, $options: "i" } },
                { designation: { $regex: search, $options: "i" } }
            ];
        }
        if (department) query.department = department;
        if (status) query.status = status;

        const employees = await Employee.find(query)
            .sort({ [sortBy]: order === "desc" ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("userId", "name email role");

        const total = await Employee.countDocuments(query);

        res.json(new ApiResponse(200, { total, page, employees }, "Employees retrieved successfully"));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Get Single Employee by ID
const getEmployeeById = asyncHandler(async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate("userId", "name email role")
            .populate("assignedClasses.classId");

        if (!employee) {
            throw new ApiError(404, "Employee not found");
        }

        res.json(new ApiResponse(200, employee, "Employee details retrieved successfully"));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Update Employee
const updateEmployee = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEmployee = await Employee.findByIdAndUpdate(id, req.body, { new: true }).populate("userId");

        if (!updatedEmployee) {
            throw new ApiError(404, "Employee not found");
        }

        res.json(new ApiResponse(200, updatedEmployee, "Employee updated successfully"));
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ✅ Delete Employee
const deleteEmployee = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete Employee
        const deletedEmployee = await Employee.findByIdAndDelete(id);
        if (!deletedEmployee) {
            throw new ApiError(404, "Employee not found");
        }

        // Delete Corresponding User
        await User.findByIdAndDelete(deletedEmployee.userId);

        res.json(new ApiResponse(200, null, "Employee deleted successfully"));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};
