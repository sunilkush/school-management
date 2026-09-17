import { AcademicYear, academicYearCode, academicYearName } from "../models/AcademicYear.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { Section } from "../models/section.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { Exam } from "../models/Exam.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";

const formatDay = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Another year of the same school whose dates overlap these, if there is one.
 *
 * Two years covering the same days make "which year is today in?" ambiguous for every screen that
 * works it out from the date, so they are refused rather than stored.
 */
async function findOverlap(schoolId, startDate, endDate, exceptId = null) {
  return AcademicYear.findOne({
    schoolId,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });
}

/** What is filed under a year — a year with any of this cannot simply be deleted. */
async function usageOf(year) {
  const where = { academicYearId: year._id };
  const [classes, sections, students, exams, feeStructures] = await Promise.all([
    SchoolClass.countDocuments(where),
    Section.countDocuments(where),
    StudentEnrollment.countDocuments(where),
    Exam.countDocuments(where),
    FeeStructure.countDocuments(where),
  ]);
  return { classes, sections, students, exams, feeStructures };
}

const describeUsage = (usage) => [
  [usage.classes, "class", "classes"],
  [usage.sections, "section", "sections"],
  [usage.students, "student enrolment", "student enrolments"],
  [usage.exams, "exam", "exams"],
  [usage.feeStructures, "fee structure", "fee structures"],
].filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`).join(", ");

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

  const name = academicYearName(startDateF, endDateF);
  const codeValue = code || academicYearCode(startDateF, endDateF);

  const overlap = await findOverlap(schoolId, startDateF, endDateF);
  if (overlap) {
    throw new ApiError(
      409,
      `These dates overlap ${overlap.name} (${formatDay(overlap.startDate)} – ${formatDay(overlap.endDate)}). A school's years cannot share days.`,
    );
  }

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
  // The active flag and status have their own endpoints (activate/archive), which also switch the
  // school's other years off; setting them here would skip that.
  const { schoolId: _schoolId, _id, isActive: _isActive, status: _status, ...updates } = req.body;

  if (updates.startDate || updates.endDate) {
    const start = new Date(updates.startDate || existingYear.startDate);
    const end = new Date(updates.endDate || existingYear.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ApiError(400, "Invalid date format");
    if (start >= end) throw new ApiError(400, "Start date must be before end date");

    const overlap = await findOverlap(existingYear.schoolId, start, end, existingYear._id);
    if (overlap) {
      throw new ApiError(
        409,
        `These dates overlap ${overlap.name} (${formatDay(overlap.startDate)} – ${formatDay(overlap.endDate)}). A school's years cannot share days.`,
      );
    }
    // findByIdAndUpdate skips the model's save hook, so the name and code are worked out here —
    // otherwise moving the dates left the old name on the year.
    updates.startDate = start;
    updates.endDate = end;
    updates.name = academicYearName(start, end);
    updates.code = academicYearCode(start, end);
  }

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

  const academicYear = await AcademicYear.findOne(buildSchoolAccessFilter(req, { _id: id }));
  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  if (academicYear.isActive) {
    throw new ApiError(409, `${academicYear.name} is the running year. Set another year running before deleting it.`);
  }

  // Classes, enrolments, exams and fees all point at their year by id. Deleting a year they point
  // at leaves them attached to nothing, so a year in use is archived instead.
  const usage = await usageOf(academicYear);
  const inUse = describeUsage(usage);
  if (inUse) {
    throw new ApiError(409, `${academicYear.name} still has ${inUse} filed under it. Archive it instead — archiving keeps them.`);
  }

  await academicYear.deleteOne();

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

  // Setting an archived year running would quietly un-archive it.
  if (academicYear.status === "archived") {
    throw new ApiError(409, `${academicYear.name} is archived and cannot be set running.`);
  }

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

  // Archiving the running year would leave the school with no running year at all, and every
  // screen that defaults to it with nothing to show.
  if (academicYear.isActive) {
    throw new ApiError(409, `${academicYear.name} is the running year. Set the next year running before archiving it.`);
  }

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
