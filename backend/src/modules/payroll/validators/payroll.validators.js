import mongoose from "mongoose";
import { ApiError } from "../../../utils/ApiError.js";

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const requireValidObjectId = (value, label = "id") => {
  if (!isValidObjectId(value)) throw new ApiError(400, `Invalid ${label}`);
};

export const validateScope = (req) => {
  const schoolId = req.body?.schoolId || req.query?.schoolId || req.user?.school?._id || req.user?.schoolId;
  const academicYearId = req.body?.academicYearId || req.query?.academicYearId || req.headers?.academicyearid || req.user?.academicYearId;
  if (!schoolId || !isValidObjectId(schoolId)) throw new ApiError(400, "Valid schoolId is required");
  if (academicYearId && !isValidObjectId(academicYearId)) throw new ApiError(400, "Valid academicYearId is required");
  return { schoolId: schoolId.toString(), academicYearId: academicYearId?.toString() };
};

export const assertSameSchool = (doc, schoolId) => {
  if (!doc) throw new ApiError(404, "Payroll resource not found");
  if (doc.schoolId?.toString() !== schoolId?.toString()) throw new ApiError(403, "Cross-school payroll access is not allowed");
};
