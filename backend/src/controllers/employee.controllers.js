import { Employee } from "../models/Employee.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// EMPLOYEE_ROLES (employee.routes.js) also grants Teacher/Sports Teacher/Transport Manager read
// access to these two endpoints for basic staff-directory lookups (assign-task pickers, driver
// info, etc. — confirmed against mobile/src, none of which ever reads bankDetails). Neither
// endpoint restricted any fields, so every one of those roles could also read every employee's
// bank account number, IFSC code, PAN, and Aadhaar number — payroll-only PII with no directory
// use case at all.
const PAYROLL_ROLES = new Set(["Super Admin", "School Admin", "Accountant"]);
const canViewBankDetails = (req) => PAYROLL_ROLES.has(req.userRole?.name);

// Create Employee
export const registerEmployee = asyncHandler(async (req, res) => {
  const {
    userId,
    name,
    email,
    password,
    roleId,
    schoolId,
    academicYearId,
    phoneNo,
    gender,
    dateOfBirth,
    bloodType,
    religion,
    employeeStatus,
    salaryId,
    accountHolder,
    accountNumber,
    ifscCode,
    bankName,
    branch,
    panNumber,
    pfNumber,
    esiNumber,
    street,
    city,
    state,
    zipCode,
    idProof,
    citizenAddress,
    employeeType,
    department,
    designation,
    employmentType,
    joinDate,
    qualification,
    experience,
    subjects,
    maritalStatus,
    notes,
  } = req.body;

  let finalUserId = userId;
  let createdUser = null;

  if (!finalUserId) {
    if (!name || !email || !password || !roleId || !schoolId) {
      throw new ApiError(
        400,
        "Name, Email, Password, RoleId, SchoolId are required to create user"
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "User with this email already exists");
    }

    const newUser = await User.create({
      name,
      email,
      password,
      roleId,
      schoolId,
      isActive: true,
    });

    finalUserId = newUser._id;
    createdUser = newUser;
  } else {
    const existingUser = await User.findOne({
      _id: finalUserId,
      isDeleted: { $ne: true },
    });
    if (!existingUser) {
      throw new ApiError(404, "User not found with given userId");
    }
  }

  const cleanedSalaryId = salaryId && salaryId !== "" ? salaryId : null;

  const cleanedSubjects =
    Array.isArray(subjects) && subjects.length > 0
      ? subjects.filter((s) => s && s !== "")
      : [];

  const cleanedQualification =
    Array.isArray(qualification) && qualification.length > 0
      ? qualification
      : [];

  // Auto-generate unique employeeCode to avoid compound unique-index conflict
  const empCount = await Employee.countDocuments({ schoolId });
  const generatedEmployeeCode = `EMP${String(empCount + 1).padStart(4, "0")}`;

  const employee = await Employee.create({
    employeeCode: generatedEmployeeCode,
    userId: finalUserId,
    schoolId,
    academicYearId: academicYearId || null,
    phoneNo,
    gender,
    dateOfBirth,
    address: {
      street,
      city,
      state,
      zipCode,
      country: "India",
    },
    idProof,
    bloodType,
    religion,
    employeeStatus,
    citizenAddress,
    employeeType,
    maritalStatus,
    department,
    designation,
    employmentType,
    joinDate,
    qualification: cleanedQualification,
    experience,
    subjects: cleanedSubjects,
    notes,
    salaryId: cleanedSalaryId,
    bankDetails: {
      accountHolder,
      accountNumber,
      ifscCode,
      bankName,
      branch,
      panNumber,
      pfNumber,
      esiNumber,
    },
    isActive: true,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser, employee },
        "Employee registered successfully"
      )
    );
});


/**
 * Get All Employees (with optional filters)
 */
export const getAllEmployees = asyncHandler(async (req, res) => {
  const { employeeType, isActive } = req.query;
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const filter = {};
  // Super Admin may optionally filter by school; others are locked to their school
  if (isSuperAdmin) {
    if (req.query.schoolId) filter.schoolId = req.query.schoolId;
  } else {
    filter.schoolId = req.user.schoolId;
  }
  if (employeeType) filter.employeeType = employeeType;
  if (isActive !== undefined) filter.isActive = isActive;

  const query = Employee.find(filter)
    .populate({ path: "userId", select: "name email regId", populate: { path: "roleId", select: "name" } })
    .populate("schoolId", "name")
    .populate("academicYearId", "name year");
  if (!canViewBankDetails(req)) query.select("-bankDetails");
  const employees = await query;

  return res
    .status(200)
    .json(new ApiResponse(200, employees, "Employees fetched successfully"));
});

// Get Single Employee
export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const query = isSuperAdmin ? { _id: id } : { _id: id, schoolId: req.user.schoolId };

  const employeeQuery = Employee.findOne(query)
    .populate({ path: "userId", select: "name email regId", populate: { path: "roleId", select: "name" } })
    .populate("schoolId", "name")
    .populate("academicYearId", "name year");
  if (!canViewBankDetails(req)) employeeQuery.select("-bankDetails");
  const employee = await employeeQuery;

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
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const query = isSuperAdmin ? { _id: id } : { _id: id, schoolId: req.user.schoolId };

  const employee = await Employee.findOneAndUpdate(query, updateData, {
    new: true,
  });

  if (!employee) throw new ApiError(404, "Employee not found");

  return res
    .status(200)
    .json(new ApiResponse(200, employee, "Employee updated successfully"));
});

// Deactivate Employee (soft delete) — the frontend calls this "Deactivate" and
// promises the record is only marked inactive, not removed. A hard delete here
// would silently orphan every PayrollStructure/PayrollEntry/LoanAdvance/
// BonusIncentive/Reimbursement record that references this employeeId.
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const query = isSuperAdmin ? { _id: id } : { _id: id, schoolId: req.user.schoolId };
  const employee = await Employee.findOneAndUpdate(query, { isActive: false }, { new: true });

  if (!employee) throw new ApiError(404, "Employee not found");

  return res
    .status(200)
    .json(new ApiResponse(200, employee, "Employee deactivated successfully"));
});
