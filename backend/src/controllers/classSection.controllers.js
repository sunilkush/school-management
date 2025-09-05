import { ClassSection } from "../models/classSection.model.js";
import { Class } from "../models/classes.model.js";
import { Section } from "../models/Section.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

/**
 * Create ClassSection mapping
 */
export const createClassSection = asyncHandler(async (req, res) => {
  const { classId, sectionId, schoolId, academicYearId } = req.body;

  if (!classId || !sectionId || !schoolId || !academicYearId) {
    throw new ApiError(400, "All fields are required!");
  }

  // check valid ObjectId
  if (
    !mongoose.Types.ObjectId.isValid(classId) ||
    !mongoose.Types.ObjectId.isValid(sectionId) ||
    !mongoose.Types.ObjectId.isValid(schoolId) ||
    !mongoose.Types.ObjectId.isValid(academicYearId)
  ) {
    throw new ApiError(400, "Invalid ID(s) provided!");
  }

  // check class & section exist
  const classExists = await Class.findById(classId);
  const sectionExists = await Section.findById(sectionId);
  if (!classExists || !sectionExists) {
    throw new ApiError(404, "Class or Section not found!");
  }

  // create mapping
  const mapping = await ClassSection.create({
    classId,
    sectionId,
    schoolId,
    academicYearId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, mapping, "Class-Section mapping created successfully!"));
});

/**
 * Get all mappings (with filters)
 */
export const getClassSections = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, classId } = req.query;

  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (classId) filter.classId = classId;

  const mappings = await ClassSection.find(filter)
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("schoolId", "name")
    .populate("academicYearId", "name startDate endDate");

  return res
    .status(200)
    .json(new ApiResponse(200, mappings, "Class-Section mappings fetched successfully!"));
});

/**
 * Get single mapping by ID
 */
export const getClassSectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mapping = await ClassSection.findById(id)
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("schoolId", "name")
    .populate("academicYearId", "name startDate endDate");

  if (!mapping) {
    throw new ApiError(404, "Mapping not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, mapping, "Class-Section mapping fetched successfully!"));
});

/**
 * Update mapping
 */
export const updateClassSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { classId, sectionId } = req.body;

  const mapping = await ClassSection.findById(id);
  if (!mapping) {
    throw new ApiError(404, "Mapping not found!");
  }

  if (classId) mapping.classId = classId;
  if (sectionId) mapping.sectionId = sectionId;

  await mapping.save();

  return res
    .status(200)
    .json(new ApiResponse(200, mapping, "Class-Section mapping updated successfully!"));
});

/**
 * Delete mapping
 */
export const deleteClassSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mapping = await ClassSection.findByIdAndDelete(id);
  if (!mapping) {
    throw new ApiError(404, "Mapping not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Class-Section mapping deleted successfully!"));
});
