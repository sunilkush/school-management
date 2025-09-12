import { Employee } from "../models/Employee.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
// Create Employee
export const registerEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    roleId,
    schoolId,
    academicYearId,
    phoneNo,
    gender,
    dateOfBirth,
    street,
    city,
    state,
    zipCode,
    idProof,
    CitizenAddress,
    employeeType,
    department,
    designation,
    employmentType,
    joinDate,
    qualification,
    experience,
    classId,
    sectionId,
    subjects,
    schedule,
    basicPay,
    allowances,
    deductions,
    notes,
  } = req.body;

  if (!name || !email || !password || !roleId || !schoolId || !phoneNo || !employeeType) {
    throw new ApiError(400, "Name, Email, Password, Role, School, Phone, EmployeeType are required");
  }

  // 1️⃣ User Create
  const user = await User.create({
    name,
    email,
    password,
    roleId,
    schoolId,
  });

  // 2️⃣ Employee Create (linked with userId)
  const employee = await Employee.create({
    userId: user._id,
    schoolId,
    academicYearId,
    phoneNo,
    gender,
    dateOfBirth,
    address: {
      street,
      city,
      state,
      zipCode,
      country: "india",
    },
    idProof,
    CitizenAddress,
    employeeType,
    department,
    designation,
    employmentType,
    joinDate,
    salary: {
      basicPay,
      allowances,
      deductions,
    },
    qualification,
    experience,
    subjects,
    assignedClasses: {
      classId,
      sectionId,
      subjects,
      schedule
    },
    notes,
    isActive: true,
  });

  return res.status(201).json(
    new ApiResponse(201, { user, employee }, "Employee registered successfully")
  );
});


/**
 * Get All Employees (with optional filters)
 */
export const getAllEmployees = asyncHandler(async (req, res) => {
  const { schoolId, employeeType, isActive } = req.query;

  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (employeeType) filter.employeeType = employeeType;
  if (isActive !== undefined) filter.isActive = isActive;

  const employees = await Employee.find(filter)
    .populate("userId", "name email roleId regId")
    .populate("schoolId", "name")
    .populate("academicYearId", "name year");

  return res
    .status(200)
    .json(new ApiResponse(200, employees, "Employees fetched successfully"));
});

// Get Single Employee
export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findById(id)
    .populate("userId", "name email roleId regId")
    .populate("schoolId", "name")
    .populate("academicYearId", "name year");

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

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
