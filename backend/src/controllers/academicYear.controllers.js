import { AcademicYear } from "../models/AcademicYear.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Helper to parse dd/mm/yyyy to Date
function parseDateString(dateStr) {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
}

// ✅ Auto-generate academic year name (e.g., "2025-2026")
function generateAcademicYearName(startDate, endDate) {
  return `${new Date(startDate).getFullYear()}-${new Date(endDate).getFullYear()}`;
}

// ✅ CREATE academic year
export const createAcademicYear = asyncHandler(async (req, res) => {
  const { code, startDate, endDate, schoolId, isActive } = req.body;
 
  if (!startDate || !endDate || !schoolId) {
    throw new ApiError(400, "Start Date, End Date, and School ID are required.");
  }

  const startDateF = parseDateString(startDate);
  const endDateF = parseDateString(endDate);
  const name = generateAcademicYearName(startDateF, endDateF);
  const codeValue = code || `AY${new Date(startDateF).getFullYear()}`;

  // Only one active year per school
  if (isActive) {
    await AcademicYear.updateMany(
      { schoolId },
      { $set: { isActive: false, status: "inactive" } }
    );
  }

  const academicYear = await AcademicYear.create({
    name,
    code: codeValue,
    startDate: startDateF,
    endDate: endDateF,
    schoolId: schoolId.trim(),
    isActive: !!isActive,
    status: isActive ? "active" : "inactive",
  });

  res.status(201).json({
    success: true,
    message: "Academic year created successfully",
    data: academicYear,
  });
});

// ✅ GET all academic years for a school
export const getAcademicYearsBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  const academicYears = await AcademicYear.find({ schoolId }).sort({ startDate: -1 });

  res.status(200).json({
    success: true,
    count: academicYears.length,
    data: academicYears,
  });
});

// ✅ GET single academic year
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

// ✅ UPDATE academic year (prevent edit if archived)
export const updateAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingYear = await AcademicYear.findById(id);
  if (!existingYear) throw new ApiError(404, "Academic year not found");

  if (existingYear.status === "archived") {
    throw new ApiError(403, "Archived academic years cannot be edited");
  }

  const updatedAcademicYear = await AcademicYear.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Academic year updated successfully",
    data: updatedAcademicYear,
  });
});

// ✅ DELETE academic year
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

// ✅ SET active academic year (only one active per school)
export const setActiveAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const academicYear = await AcademicYear.findById(id);
  if (!academicYear) throw new ApiError(404, "Academic year not found");

  // Deactivate others
  await AcademicYear.updateMany(
    { schoolId: academicYear.schoolId },
    { $set: { isActive: false, status: "inactive" } }
  );

  // Activate selected one
  academicYear.isActive = true;
  academicYear.status = "active";
  await academicYear.save();

  res.status(200).json({
    success: true,
    message: "Academic year set as active successfully",
    data: academicYear,
  });
});

// ✅ ARCHIVE academic year (soft lock)
export const archiveAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const academicYear = await AcademicYear.findById(id);
  if (!academicYear) throw new ApiError(404, "Academic year not found");

  academicYear.status = "archived";
  academicYear.isActive = false;
  await academicYear.save();

  res.status(200).json({
    success: true,
    message: "Academic year archived successfully",
    data: academicYear,
  });
});

// ✅ GET currently active year by school
export const getActiveAcademicYearBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  const academicYear = await AcademicYear.findOne({
    schoolId: schoolId.trim(),
    isActive: true,
    status: "active",
  });

  if (!academicYear) {
    throw new ApiError(404, "No active academic year found for this school");
  }

  res.status(200).json({
    success: true,
    message: "Active academic year retrieved successfully",
    data: academicYear,
  });
});
