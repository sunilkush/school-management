import { Employee } from "../models/Employee.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import { findForbiddenRole } from "../utils/roleAssignment.js";
import { highestSuffix, nextSequence } from "../utils/sequence.js";

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

  // The school came from the request body, and the new account's role was never checked, so any
  // caller on this route — an Accountant included — could create a user in another school, with
  // any role there or the platform's Super Admin role. The school now comes from the token (a
  // Super Admin may name one), and the role goes through the same guard as registerUser.
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const schoolId = isSuperAdmin ? req.body.schoolId : req.user.schoolId;
  if (!schoolId) throw new ApiError(400, "schoolId is required");
  // Required when an employee is registered by hand, as the form asks. The model no longer
  // insists, because records made automatically for staff users may not have them yet.
  if (!phoneNo) throw new ApiError(400, "Phone number is required");
  if (!gender) throw new ApiError(400, "Gender is required");

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

    const requestedRole = await Role.findById(roleId).select("_id name schoolId").lean();
    if (!requestedRole) throw new ApiError(400, "Invalid role");
    const forbiddenRole = findForbiddenRole([requestedRole], { isSuperAdmin, callerSchoolId: req.user?.schoolId });
    if (forbiddenRole) throw new ApiError(403, `Not allowed to assign role "${forbiddenRole.name}"`);
    // An Accountant may add staff, not the people who run the school.
    const LEADERSHIP_ROLES = ["School Admin", "Principal", "Vice Principal"];
    if (!isSuperAdmin && req.userRole?.name !== "School Admin" && LEADERSHIP_ROLES.includes(requestedRole.name)) {
      throw new ApiError(403, `Not allowed to assign role "${requestedRole.name}"`);
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
      schoolId,
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

  // The school's next employee code, from an atomic counter. Counting the employees and adding
  // one gave the same code to two people registered at the same moment, and gave a code that was
  // already in use once anyone had been removed — either way the unique (schoolId, employeeCode)
  // index refused the save and registration failed. The counter starts after the highest code
  // already issued in this format.
  const generatedEmployeeCode = `EMP${String(
    await nextSequence(`empcode:${schoolId}`, async () => {
      const issued = await Employee.find({ schoolId }).select("employeeCode").lean();
      return highestSuffix(issued.map((e) => e.employeeCode).filter((c) => String(c || "").startsWith("EMP")), "EMP");
    })
  ).padStart(4, "0")}`;

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
  const { employeeType, isActive, page = 1, limit = 1000 } = req.query;
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

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 1000, 1), 3000);
  const skip = (pageNumber - 1) * limitNumber;

  const query = Employee.find(filter)
    .populate({ path: "userId", select: "name email regId", populate: { path: "roleId", select: "name" } })
    .populate("schoolId", "name")
    .populate("academicYearId", "name year")
    .skip(skip)
    .limit(limitNumber);
  if (!canViewBankDetails(req)) query.select("-bankDetails");
  const [employees, total] = await Promise.all([query, Employee.countDocuments(filter)]);

  return res
    .status(200)
    .json(new ApiResponse(200, employees, "Employees fetched successfully", {
      pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
    }));
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
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const query = isSuperAdmin ? { _id: id } : { _id: id, schoolId: req.user.schoolId };

  // schoolId/_id/userId must not be attacker-settable via the body — otherwise a caller could
  // reassign this employee into another school's namespace despite the read-scope check above.
  const { schoolId: _schoolId, _id, userId: _userId, ...updateData } = req.body;

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
  // Payroll pro-rates a leaver's final cycle against this date (see generatePayrollCycle) —
  // without it, a mid-month leaver was either paid for the whole month or excluded from that
  // cycle's payroll entirely.
  const relievingDate = req.body?.relievingDate ? new Date(req.body.relievingDate) : new Date();
  const employee = await Employee.findOneAndUpdate(query, { isActive: false, relievingDate }, { new: true });

  if (!employee) throw new ApiError(404, "Employee not found");

  return res
    .status(200)
    .json(new ApiResponse(200, employee, "Employee deactivated successfully"));
});
