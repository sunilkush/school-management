import mongoose from "mongoose";
import { Role } from "../models/Roles.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

// Hostel records (leave, visitors, complaints, attendance) point at a student's user account and are
// sent back populated with that user's name and contact details. Any id the request names must be a
// Student of the school the record is filed under; unchecked, another school's child was saved and
// their details came back in the response.
export const assertSchoolStudents = async (schoolId, ids) => {
  const unique = [...new Set((Array.isArray(ids) ? ids : [ids]).map((id) => String(id ?? "")))];
  if (!unique.length || unique.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new ApiError(400, "Invalid studentId");
  }

  const studentRoleIds = await Role.find({ name: "Student" }).distinct("_id");
  const found = await User.countDocuments({
    _id: { $in: unique },
    schoolId,
    roleId: { $in: studentRoleIds },
    isDeleted: { $ne: true },
  });
  if (found !== unique.length) throw new ApiError(404, "Student not found in this school");
};
