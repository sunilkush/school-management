import { Employee } from "../models/Employee.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Employee
export const createEmployee = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data.userId || !data.schoolId || !data.academicYearId) {
    throw new ApiError(400, "userId, schoolId, academicYearId are required");
  }

  const employee = await Employee.create(data);

  return res
    .status(201)
    .json(new ApiResponse(201, employee, "Employee created successfully"));
});

// Get All Employees with filter & pagination
export const getAllEmployees = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    schoolId,
    academicYearId,
    employeeType,
    isActive,
  } = req.query;

  const query = {};
  if (schoolId) query.schoolId = schoolId;
  if (academicYearId) query.academicYearId = academicYearId;
  if (employeeType) query.employeeType = employeeType;
  if (isActive !== undefined) query.isActive = isActive;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Employee.countDocuments(query);

  const employees = await Employee.find(query)
    .populate("userId", "email name role")
    .populate("schoolId", "name")
    .populate("subjects")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, {
      data: employees,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    })
  );
});

// Get Single Employee
export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findById(id)
    .populate("userId", "email name role")
    .populate("schoolId", "name")
    .populate("subjects");

  if (!employee) throw new ApiError(404, "Employee not found");

  return res
    .status(200)
    .json(new ApiResponse(200, employee, "Employee fetched successfully"));
});

// Update Employee
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const employee = await Employee.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  return res
    .status(200)
    .json(new ApiResponse(200, employee, "Employee updated successfully"));
});

// Delete Employee
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employee = await Employee.findByIdAndDelete(id);

  if (!employee) throw new ApiError(404, "Employee not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Employee deleted successfully"));
});
