import { ClassTeacherAssignment } from "../models/ClassTeacherAssignment.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const populate = [
  { path: "teacherId",     select: "name email avatar" },
  { path: "schoolClassId", select: "name grade" },
  { path: "sectionId",     select: "name" },
  { path: "academicYearId", select: "name" },
];

const resolveAcademicYear = async (schoolId, yearId) => {
  if (yearId) return yearId;
  const ay = await AcademicYear.findOne({ schoolId, isActive: true }).lean();
  if (!ay) throw new ApiError(400, "No active academic year found for this school");
  return ay._id;
};

/* ── GET all assignments for a school ───────────────────────────── */
export const getClassTeacherAssignments = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new ApiError(400, "School context required");

  const { academicYearId } = req.query;
  const ayId = await resolveAcademicYear(schoolId, academicYearId);

  const assignments = await ClassTeacherAssignment.find({
    schoolId, academicYearId: ayId, isActive: true,
  }).populate(populate).lean();

  return res.status(200).json(new ApiResponse(200, assignments, "Fetched successfully"));
});

/* ── GET my assignment (for a teacher) ──────────────────────────── */
export const getMyClassTeacherAssignment = asyncHandler(async (req, res) => {
  const teacherId = req.user?._id;
  const schoolId  = req.user?.schoolId;

  const assignment = await ClassTeacherAssignment.findOne({
    teacherId, schoolId, isActive: true,
  }).populate(populate).lean();

  return res.status(200).json(
    new ApiResponse(200, assignment || null, assignment ? "Found" : "No class teacher assignment")
  );
});

/* ── ASSIGN / UPSERT ─────────────────────────────────────────────── */
export const assignClassTeacher = asyncHandler(async (req, res) => {
  const { teacherId, schoolClassId, sectionId, academicYearId } = req.body;
  const schoolId  = req.user?.schoolId;
  const adminId   = req.user?._id;

  if (!teacherId || !schoolClassId) {
    throw new ApiError(400, "teacherId and schoolClassId are required");
  }

  const ayId = await resolveAcademicYear(schoolId, academicYearId);

  // Deactivate existing assignment for this class-section (if any)
  await ClassTeacherAssignment.updateMany(
    { schoolId, academicYearId: ayId, schoolClassId, sectionId: sectionId || null, isActive: true },
    { isActive: false }
  );

  // Deactivate existing assignment of this teacher (one teacher = one class)
  await ClassTeacherAssignment.updateMany(
    { schoolId, academicYearId: ayId, teacherId, isActive: true },
    { isActive: false }
  );

  const assignment = await ClassTeacherAssignment.create({
    teacherId, schoolClassId,
    sectionId: sectionId || null,
    academicYearId: ayId,
    schoolId,
    assignedBy: adminId,
    isActive: true,
  });

  const populated = await ClassTeacherAssignment.findById(assignment._id)
    .populate(populate).lean();

  return res.status(201).json(new ApiResponse(201, populated, "Class teacher assigned successfully"));
});

/* ── REMOVE assignment ───────────────────────────────────────────── */
export const removeClassTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = req.user?.schoolId;

  const assignment = await ClassTeacherAssignment.findOne({ _id: id, schoolId });
  if (!assignment) throw new ApiError(404, "Assignment not found");

  assignment.isActive = false;
  await assignment.save();

  return res.status(200).json(new ApiResponse(200, null, "Class teacher removed successfully"));
});
