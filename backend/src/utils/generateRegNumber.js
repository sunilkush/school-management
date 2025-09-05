import mongoose from "mongoose";

/**
 * Generate next registration number
 * Format: REG{YEAR}-{SEQUENCE}
 * Example: REG2025-0001
 */
export const generateNextRegNumber = async (schoolId, academicYearId, Student) => {
  // 🔹 Find last student for this school + academic year
  const lastStudent = await Student.findOne({ schoolId, academicYearId })
    .sort({ createdAt: -1 })
    .select("registrationNumber");

  let nextSequence = 1;

  if (lastStudent?.registrationNumber) {
    // Extract number part after "-"
    const parts = lastStudent.registrationNumber.split("-");
    if (parts.length === 2) {
      const num = parseInt(parts[1]) || 0;
      nextSequence = num + 1;
    }
  }

  // 🔹 Fetch academic year details
  const AcademicYear = mongoose.model("AcademicYear");
  const academicYear = await AcademicYear.findById(academicYearId);

  const yearPrefix = academicYear?.startDate
    ? new Date(academicYear.startDate).getFullYear()
    : new Date().getFullYear();

  // 🔹 Format with padding
  const sequenceStr = String(nextSequence).padStart(4, "0"); // 0001, 0002...
  return `REG${yearPrefix}-${sequenceStr}`;
};
