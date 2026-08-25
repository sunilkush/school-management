import { AcademicYear } from "../models/AcademicYear.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";
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
  const { code, startDate, endDate, isActive } = req.body;
  // Forces schoolId to the caller's own school for everyone except Super Admin — previously
  // req.body.schoolId was trusted outright, letting a School Admin create academic years for
  // (and deactivate the currently-active year of) a school that isn't theirs.
  const { schoolId } = buildSchoolAccessFilter(req, { schoolId: req.body.schoolId });

  if (!startDate || !endDate || !schoolId) {
    throw new ApiError(400, "Start Date, End Date, and School ID are required.");
  }

  // ✅ Direct ISO parsing
  const startDateF = new Date(startDate);
  const endDateF = new Date(endDate);

  // ✅ Validation
  if (isNaN(startDateF.getTime()) || isNaN(endDateF.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  if (startDateF >= endDateF) {
    throw new ApiError(400, "Start date must be before end date");
  }

  const name = generateAcademicYearName(startDateF, endDateF);
  const codeValue = code || `AY${startDateF.getFullYear()}`;

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
    // schoolId may now come from req.user.schoolId (an ObjectId, not a string) rather than
    // always req.body.schoolId — String(...) handles both instead of assuming .trim() exists.
    schoolId: String(schoolId).trim(),
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
  // The route (GET /academicYear/school/:schoolId) has no role restriction, so any
  // authenticated user could otherwise list another school's academic years just by editing
  // the URL — buildSchoolAccessFilter forces schoolId back to the caller's own school unless
  // they're Super Admin.
  const filter = buildSchoolAccessFilter(req, { schoolId: req.params.schoolId });

  const academicYears = await AcademicYear.find(filter).sort({ startDate: -1 });

  res.status(200).json({
    success: true,
    count: academicYears.length,
    data: academicYears,
  });
});

// ✅ GET single academic year
export const getSingleAcademicYear = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const academicYear = await AcademicYear.findOne(buildSchoolAccessFilter(req, { _id: id }));

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

  const existingYear = await AcademicYear.findOne(buildSchoolAccessFilter(req, { _id: id }));
  if (!existingYear) throw new ApiError(404, "Academic year not found");

  if (existingYear.status === "archived") {
    throw new ApiError(403, "Archived academic years cannot be edited");
  }

  // schoolId/_id must not be attacker-settable via the body — otherwise a caller could reassign
  // this academic year into another school's namespace despite the read-scope check above.
  const { schoolId: _schoolId, _id, ...updates } = req.body;

  const updatedAcademicYear = await AcademicYear.findByIdAndUpdate(id, updates, {
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

  const academicYear = await AcademicYear.findOneAndDelete(buildSchoolAccessFilter(req, { _id: id }));

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

  const academicYear = await AcademicYear.findOne(buildSchoolAccessFilter(req, { _id: id }));
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

  const academicYear = await AcademicYear.findOne(buildSchoolAccessFilter(req, { _id: id }));
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
  // Same tenancy fix as getAcademicYearsBySchool above — this route also has no role
  // restriction, so schoolId must come from the caller's own session, not the URL, unless
  // they're Super Admin.
  const { schoolId } = buildSchoolAccessFilter(req, { schoolId: req.params.schoolId });

  const academicYear = await AcademicYear.findOne({
    schoolId: String(schoolId).trim(),
    isActive: true,
    status: "active",
  });

  if (!academicYear) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No active academic year found for this school"));
  }

  res.status(200).json({
    success: true,
    message: "Active academic year retrieved successfully",
    data: academicYear,
  });
});
