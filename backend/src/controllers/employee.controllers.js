import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { Employee } from "../models/Employee.model";

const createEmployee = asyncHandler(async (req, res) => {
    const { name, email, passward, role, schoolId, phoneNo, gender, dateOfBirth, address, department, designation, joinDate
        , employmentType, salary, assignedClasses, status
    } = req.body

    if ([name, email, passward, role, schoolId, phoneNo, gender, dateOfBirth, address, department, designation, joinDate
        , employmentType, salary, assignedClasses, status].some((field) => field?.trim() === '')) {
        throw new ApiError(400, "All Field Required !")
    }

    const exitingUser = await User.findOne({ email });

    if (exitingUser) {
        throw new ApiError(400, "Already registerd !")
    }
    const newUser = await User.create({
        name, email, passward, role, schoolId
    })

    if (!newUser) {
        throw new ApiError(400, "User Doesn't Create !")
    }

    createUser = await User.findById(newUser?._id).select('-password,refreshToken')

    const employee = await Employee.create({
        phoneNo, gender, dateOfBirth, address, department, designation, joinDate
        , employmentType, salary, assignedClasses, status
    })

    if (!employee) {
        throw new ApiError(404, "Employee Not Found !")
    }

    return res.status(201).json(
        new ApiResponse(200, { createUser, employee }, "Successfully Create")
    )

})

const getEmployees = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sortBy = "createdAt", order = "desc", department, status } = req.query;

        // Build Query
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
            .limit(parseInt(limit));

        const total = await Employee.countDocuments(query);

        res.json(
            new ApiResponse(200, { total, page, employees }, "Successfully found ")
        );
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Get Single Employee
export const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).populate("userId").populate("assignedClasses.classId");
        if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Update Employee
export const updateEmployee = async (req, res) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEmployee) return res.status(404).json({ success: false, message: "Employee not found" });

        res.json({ success: true, data: updatedEmployee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ✅ Delete Employee
export const deleteEmployee = async (req, res) => {
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        if (!deletedEmployee) return res.status(404).json({ success: false, message: "Employee not found" });

        res.json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    createEmployee,
    getEmployees
}