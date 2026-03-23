import { SchoolClass } from "../models/schoolClass.model.js";

// 🔹 CREATE
export const createSchoolClass = async (req, res) => {
  try {
    const {
      schoolId,
      academicYearId,
      boardClassId,
    } = req.body;

    // validation
    if (!schoolId || !academicYearId || !boardClassId) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // prevent duplicate (extra safety)
    const exists = await SchoolClass.findOne({
      schoolId,
      academicYearId,
      boardClassId,
    });

    if (exists) {
      return res.status(400).json({
        message: "Class already mapped!",
      });
    }

    const newClass = await SchoolClass.create({
      schoolId,
      academicYearId,
      boardClassId,
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// 🔹 GET ALL (with filters)
export const getAllSchoolClasses = async (req, res) => {
  try {
    const { schoolId, academicYearId } = req.query;

    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (academicYearId) filter.academicYearId = academicYearId;

    const classes = await SchoolClass.find(filter)
      .populate("classId", "name")
      .populate("boardClassId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// 🔹 GET SINGLE
export const getSchoolClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await SchoolClass.findById(id)
      .populate("classId")
      .populate("boardClassId");

    if (!data) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// 🔹 UPDATE
export const updateSchoolClass = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await SchoolClass.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: req.user?._id,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// 🔹 DELETE
export const deleteSchoolClass = async (req, res) => {
  try {
    const { id } = req.params;

    await SchoolClass.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};