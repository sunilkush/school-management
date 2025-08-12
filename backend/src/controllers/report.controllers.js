import { Report } from "../models/Report.model.js";
import APIFeatures from "../utils/apiFeatures.js";

// @desc Get all reports with filtering, sorting, field limiting, pagination
export const getReport = async (req, res) => {
  try {
    // Build query using APIFeatures
    const features = new APIFeatures(
      Report.find()
        .populate("school", "name")
        .populate("generatedBy", "name"),
      req.query
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
    const newReport = await Report.create({
      ...req.body,
      generatedBy: req.user._id, // from auth middleware
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
