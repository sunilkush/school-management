import { AcademicYear } from "../models/AcademicYear.model.js";

/**
 * Middleware to ensure user has an active academic year.
 * Blocks request if user's school has no active academic year (unless Super Admin).
 */
export const checkActiveAcademicYear = async (req, res, next) => {
  try {
   
    // Allow Super Admin to bypass
    if (req.user?.role === "School Admin") {
      return next();
    }

    // School ID is required
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID missing from user session.",
      });
    }

    // Check for active academic year in that school
    const activeYear = await AcademicYear.findOne({
      schoolId,
      isActive: true,
      status: "active",
    });

    if (!activeYear) {
      return res.status(403).json({
        success: false,
        message: "No active academic year found. Please contact the admin.",
      });
    }

    // Attach academic year ID to request for downstream use
    req.academicYearId = activeYear._id;
    next();
  } catch (error) {
    console.error("Active Year Check Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking academic year.",
    });
  }
};
