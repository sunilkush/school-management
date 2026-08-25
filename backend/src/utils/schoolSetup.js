import { AcademicYear } from "../models/AcademicYear.model.js";
import { Role } from "../models/Roles.model.js";
import { DEFAULT_ROLE_PERMISSIONS, ROLE_LEVEL_MAP } from "./roleDefaults.js";

// Roles every new school gets out of the box. Super Admin is deliberately excluded — that's
// a platform-level (schoolId: null) role, not something to duplicate per school.
const DEFAULT_SCHOOL_ROLES = ["School Admin", "Teacher", "Student", "Parent"];

/**
 * Initialize default setup for a new school: seeds its academic year and its default
 * per-school roles (School Admin/Teacher/Student/Parent) with the standard permission set.
 *
 * Deliberately does NOT create a default admin User — that used to insert one with a
 * predictable email and a hardcoded weak password (which also failed the User model's own
 * complexity validation, so it silently never worked). Assigning the first School Admin is
 * left to the normal "create user" flow, where a real password is chosen.
 */
export const initializeNewSchool = async (schoolId) => {
  try {
    // 1️⃣ Create default academic year
    // Previously passed `name`/`isCurrent` only — `isCurrent` isn't a schema field (the model
    // uses `isActive`/`status`) and `startDate`/`endDate` are required, so this always threw a
    // ValidationError that the outer catch swallowed silently, and no academic year (nor
    // anything after it, since the throw aborted the rest of this function) was ever created.
    // `name`/`code` are derived from start/end year by the model's own pre-save hook.
    const existingYear = await AcademicYear.findOne({ schoolId });
    if (!existingYear) {
      const now = new Date();
      // Matches this app's Indian-school-calendar convention (June–April) used elsewhere.
      const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;

      await AcademicYear.create({
        startDate: new Date(Date.UTC(startYear, 5, 1)),
        endDate: new Date(Date.UTC(startYear + 1, 3, 30)),
        isActive: true,
        status: "active",
        schoolId,
      });
    }

    // 2️⃣ Create default roles (idempotent — safe to call more than once for the same school)
    for (const name of DEFAULT_SCHOOL_ROLES) {
      const existingRole = await Role.findOne({ name, schoolId });
      if (existingRole) continue;

      await Role.create({
        name,
        code: name.replace(/\s+/g, "_").toUpperCase(),
        type: "custom",
        level: ROLE_LEVEL_MAP[name],
        permissions: DEFAULT_ROLE_PERMISSIONS[name],
        schoolId,
      });
    }

    console.log(`✅ School setup completed for schoolId: ${schoolId}`);
  } catch (error) {
    console.error("❌ Error initializing school setup:", error);
  }
};
