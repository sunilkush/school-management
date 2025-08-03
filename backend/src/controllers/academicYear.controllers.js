import { AcademicYear } from "../models/AcademicYear.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// CREATE academic year
export const createAcademicYear = asyncHandler(async (req, res) => {
  const { name, code, startDate, endDate, schoolId, isActive } = req.body;

  if (!name || !code || !startDate || !endDate || !schoolId) {
    throw new ApiError(400, "All required fields must be provided.");
  }

  // Check if the same name OR same schoolId exists
  const existingYear = await AcademicYear.findOne({
    $or: [
      { name: name.trim() },
      { schoolId: schoolId.trim() }
    ]
  });

  if (existingYear) {
    return res.status(409).json({
      success: false,
      message: "Academic Year already exists with this name or school"
    });
  }

  // Parse date from dd/mm/yyyy to Date object
  function parseDateString(dateStr) {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  }

  const startDateF = parseDateString(startDate);
  const endDateF = parseDateString(endDate);

  // Only one active year per school
  if (isActive) {
    await AcademicYear.updateMany({ schoolId }, { $set: { isActive: false } });
  }

  const academicYear = await AcademicYear.create({
    name: name.trim(),
    code: code.trim(),
    startDate: startDateF,
    endDate: endDateF,
    schoolId: schoolId.trim(),
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

  const academicYears = await AcademicYear.find({ schoolId: schoolId }).sort({ startDate: -1 });

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

export const setActiveAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

 

  // ✅ Find the academic year by ID
  const academicYear = await AcademicYear.findById(id);
  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  // ✅ Set all academic years in this school to inactive + status: 'inactive'
  await AcademicYear.updateMany(
    { schoolId: academicYear.schoolId },
    { $set: { isActive: false, status: "inactive" } }
  );

  // ✅ Set selected academic year to active + status: 'active'
  academicYear.isActive = true;
  academicYear.status = "active";
  await academicYear.save();

  res.status(200).json({
    success: true,
    message: "Academic year set as active successfully",
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
