import { SchoolClass } from "../models/schoolClass.model.js";

// 🔹 CREATE
export const createSchoolClass = async (req, res) => {
  try {
    const { schoolId, academicYearId, boardClassId, name } = req.body;

    // ✅ VALIDATION
    if (!schoolId || !academicYearId || !boardClassId || !name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ DUPLICATE CHECK (as per schema unique index)
    const exists = await SchoolClass.findOne({
      schoolId,
      academicYearId,
      boardClassId,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Class already mapped for this academic year",
      });
    }

    // ✅ CREATE
    const newClass = await SchoolClass.create({
      schoolId,
      academicYearId,
      boardClassId,
      name,
      sections: [], // ✅ always initialize
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔹 GET ALL
export const getAllSchoolClasses = async (req, res) => {
  try {
    const { schoolId, academicYearId } = req.query;
  
    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (academicYearId) filter.academicYearId = academicYearId;

    const classes = await SchoolClass.find(filter)
      .populate("boardClassId", "name")
      .populate("sections.sectionId", "name")
      .populate("sections.teacherId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔹 GET SINGLE
export const getSchoolClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await SchoolClass.findById(id)
      .populate("boardClassId", "name")
      .populate("sections.sectionId", "name")
      .populate("sections.teacherId", "name");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "School class not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
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
      { new: true, runValidators: true }
    )
      .populate("sections.sectionId", "name")
      .populate("sections.teacherId", "name");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "School class not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔹 DELETE
export const deleteSchoolClass = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SchoolClass.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "School class not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};