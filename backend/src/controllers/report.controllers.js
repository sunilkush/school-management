import { Report } from "../models/Report.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { School } from "../models/school.model.js";
import APIFeatures from "../utils/apiFeatures.js";

// @desc Get all reports with filtering, sorting, field limiting, pagination
// Get reports
export const getReport = async (req, res) => {
  try {
    const queryObj = { ...req.query };

    // If IDs are passed, no need to convert names
    if (queryObj.session) {
      const academicYear = await AcademicYear.findById(queryObj.session);
      if (!academicYear) {
        return res.status(404).json({ status: "error", message: "Academic year not found" });
      }
    }

    if (queryObj.school) {
      const schoolDoc = await School.findById(queryObj.school);
      if (!schoolDoc) {
        return res.status(404).json({ status: "error", message: "School not found" });
      }
    }

    const features = new APIFeatures(
      Report.find(queryObj)
        .populate("school", "name")
        .populate("session", "name")
        .populate("generatedBy", "name"),
      queryObj
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reports = await features.query;

    res.status(200).json({
      status: "success",
      results: reports.length,
      data: reports,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
// @desc Create report
export const createReport = async (req, res) => {
  try {
    const { session, school, ...rest } = req.body;

    // Validate session exists
    const academicYear = await AcademicYear.findById(session);
    if (!academicYear) {
      return res.status(400).json({ status: "error", message: "Academic year not found" });
    }

    // Validate school exists
    const schoolDoc = await School.findById(school);
    if (!schoolDoc) {
      return res.status(400).json({ status: "error", message: "School not found" });
    }

    const newReport = await Report.create({
      ...rest,
      session: academicYear._id,
      school: schoolDoc._id,
      generatedBy: req.user._id,
    });

    res.status(201).json({
      status: "success",
      data: newReport,
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// @desc Delete report
export const deleteReport = async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Report not found" });
    }

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// @desc View single report
export const viewReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("school", "name")
      .populate("session", "name")
      .populate("generatedBy", "name");

    if (!report) {
      return res.status(404).json({ status: "error", message: "Report not found" });
    }

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
