import { Employee } from "../models/Employee.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
// Create Employee
export const registerEmployee = async (req, res) => {
  try {
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

    // 👉 Case 1: अगर userId नहीं है → नया User create करो
    if (!finalUserId) {
      if (!name || !email || !password || !roleId || !schoolId) {
        return res.status(400).json(
          new ApiError(
            400,
            "Name, Email, Password, RoleId, SchoolId are required to create user"
          )
        );
      }

      // check duplicate email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json(new ApiError(400, "User with this email already exists"));
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
      // 👉 Case 2: अगर userId दिया गया है तो check कर लो valid है या नहीं
      const existingUser = await User.findById(finalUserId);
      if (!existingUser) {
        return res
          .status(404)
          .json(new ApiError(404, "User not found with given userId"));
      }
    }

    // 🔧 Clean data before saving (fix Cast to ObjectId errors)
    const cleanedSalaryId =
      salaryId && salaryId !== "" ? salaryId : null;

    const cleanedSubjects =
      Array.isArray(subjects) && subjects.length > 0
        ? subjects.filter((s) => s && s !== "")
        : [];

    const cleanedQualification =
      Array.isArray(qualification) && qualification.length > 0
        ? qualification
        : [];

    // 👉 अब Employee create होगा
    const employee = await Employee.create({
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
  } catch (error) {
    console.error("❌ Error in registerEmployee:", error.message);
    return res
      .status(500)
      .json(new ApiError(500, error.message || "Internal Server Error"));
  }
};


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
