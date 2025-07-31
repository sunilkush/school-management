import { AcademicYear } from "../models/academicYear.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// CREATE academic year
export const createAcademicYear = asyncHandler(async (req, res) => {
  const { name, code, startDate, endDate, description, school, isActive } = req.body;

  if (!name || !code || !startDate || !endDate || !school) {
    throw new ApiError(400, "All required fields must be provided.");
  }

  // Optional: Only one active year per school
  if (isActive) {
    await AcademicYear.updateMany({ school }, { $set: { isActive: false } });
  }

  const academicYear = await AcademicYear.create({
    name,
    code,
    startDate,
    endDate,
    description,
    school,
    isActive: !!isActive,
  });

  res.status(201).json({
    success: true,
    message: "Academic year created successfully",
    data: academicYear,
  });
});

// GET academic years by school
export const getAcademicYearsBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  const academicYears = await AcademicYear.find({ school: schoolId }).sort({ startDate: -1 });

  res.status(200).json({
    success: true,
    count: academicYears.length,
    data: academicYears,
  });
});

// GET single academic year
export const getSingleAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const academicYear = await AcademicYear.findById(id);

  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  res.status(200).json({
    success: true,
    data: academicYear,
  });
});

// UPDATE academic year
export const updateAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedAcademicYear = await AcademicYear.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedAcademicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  res.status(200).json({
    success: true,
    message: "Academic year updated successfully",
    data: updatedAcademicYear,
  });
});

// DELETE academic year
export const deleteAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const academicYear = await AcademicYear.findByIdAndDelete(id);

  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  res.status(200).json({
    success: true,
    message: "Academic year deleted successfully",
  });
});

// SET active academic year
export const setActiveAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const academicYear = await AcademicYear.findById(id);
  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  // Set all others inactive for this school
  await AcademicYear.updateMany({ school: academicYear.school }, { $set: { isActive: false } });

  // Set selected one active
  academicYear.isActive = true;
  await academicYear.save();

  res.status(200).json({
    success: true,
    message: "Active academic year updated successfully",
    data: academicYear,
  });
});

// GET active academic year for a school
export const getActiveAcademicYearBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  const academicYear = await AcademicYear.findOne({
    school: schoolId,
    isActive: true,
  });

  if (!academicYear) {
    throw new ApiError(404, "No active academic year found for this school");
  }

  res.status(200).json({
    success: true,
    data: academicYear,
  });
});
