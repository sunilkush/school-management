import mongoose from "mongoose";
import { Student } from "../models/student.model.js";

/**
 * Generate next registration number
 * Format: REG{YEAR}-{SEQUENCE}
 * Example: REG2025-0001
 */
export const generateNextRegNumber = async (schoolId, academicYearId) => {
  // Ensure IDs are ObjectId
  const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
  const academicYearObjectId = new mongoose.Types.ObjectId(academicYearId);

  // 🔹 Find last student for this school + academic year
  const lastStudent = await Student.findOne({
    schoolId: schoolObjectId,
    academicYearId: academicYearObjectId,
  })
    .sort({ createdAt: -1 })
    .select("registrationNumber");

  // 🔹 Determine next sequence number
  let nextSequence = 1;
  if (lastStudent?.registrationNumber) {
    const parts = lastStudent.registrationNumber.split("-");
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10) || 0;
      nextSequence = num + 1;
    }
  }

  // 🔹 Use current year as prefix
  const yearPrefix = new Date().getFullYear();

  // 🔹 Format sequence with leading zeros
  const sequenceStr = String(nextSequence).padStart(4, "0"); // 0001, 0002, ...

  return `REG${yearPrefix}-${sequenceStr}`;
};
