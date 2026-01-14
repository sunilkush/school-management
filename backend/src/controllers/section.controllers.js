import { Section } from "../models/section.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * ===============================
 * CREATE SECTION
 * ===============================
 */
export const createSection = asyncHandler(async (req, res) => {
  const { name, academicYearId, schoolId} = req.body;

  if (!name || !academicYearId || !schoolId ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingSection = await Section.findOne({
    name,
    academicYearId,
    schoolId,
   
  });

  if (existingSection) {
    throw new ApiError(409, "Section already exists");
  }

  const section = await Section.create({
    name,
    academicYearId,
    schoolId,
    
    createdBy: req.user?._id || null,
  });

  res
    .status(201)
    .json(new ApiResponse(201, section, "Section created successfully"));
});

/**
 * ===============================
 * GET SECTIONS (FILTERED)
 * ===============================
 */
export const getSections = asyncHandler(async (req, res) => {
  const { schoolId, classId, academicYearId } = req.query;

  const filters = {};
  if (schoolId) filters.schoolId = schoolId;
  if (classId) filters.classId = classId;
  if (academicYearId) filters.academicYearId = academicYearId;

  const sections = await Section.find(filters)
    .populate("classId", "name")
    .populate("academicYearId", "name")
    .sort({ name: 1 });
   
  res
    .status(200)
    .json(new ApiResponse(200, sections, "Sections fetched successfully"));
});

/**
 * ===============================
 * UPDATE SECTION
 * ===============================
 */
export const updateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const section = await Section.findById(id);
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const updatedSection = await Section.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedSection, "Section updated successfully")
    );
});

/**
 * ===============================
 * DELETE SECTION
 * ===============================
 */
export const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const section = await Section.findById(id);
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  await Section.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Section deleted successfully"));
});
