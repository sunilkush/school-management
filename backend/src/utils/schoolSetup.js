import { AcademicYear } from "../models/AcademicYear.model.js";
import { Subject } from "../models/subject.model.js";
import { Role } from "../models/Roles.model.js";
import { User } from "../models/user.model.js";
import { ClassSection } from "../models/classSection.model.js";

/**
 * Initialize default setup for a new school
 */
export const initializeNewSchool = async (schoolId) => {
  try {
    // 1️⃣ Create default academic year
    const existingYear = await AcademicYear.findOne({ schoolId });
    if (!existingYear) {
      await AcademicYear.create({
        name: "2025-26",
        isCurrent: true,
        schoolId,
      });
    }

    // 2️⃣ Copy master subjects to new school
    const Subjects = await SubjectMaster.find({});
    if (Subjects.length > 0) {
      const schoolSubjects = Subjects.map((s) => ({
        name: s.name,
        code: s.code,
        description: s.description || "",
        schoolId,
      }));
      await Subject.insertMany(schoolSubjects);
    }

    // 3️⃣ Create default roles
    const roles = [
      { name: "SchoolAdmin", permissions: ["*"], schoolId },
      { name: "Teacher", permissions: ["viewStudents", "addMarks"], schoolId },
      { name: "Student", permissions: ["viewProfile", "viewMarks"], schoolId },
      { name: "Parent", permissions: ["viewChild", "viewMarks"], schoolId },
    ];
    await Role.insertMany(roles);

    // 4️⃣ Create default admin user
    const defaultAdmin = await User.create({
      name: "Default Admin",
      email: `admin_${schoolId}@school.com`,
      password: "123456",
      role: "SchoolAdmin",
      schoolId,
    });

    // 5️⃣ Create default class structure
    const classes = [
      { className: "Nursery", section: "A", schoolId },
      { className: "KG", section: "A", schoolId },
      { className: "1st", section: "A", schoolId },
    ];
    await ClassSection.insertMany(classes);

    console.log(`✅ School setup completed for schoolId: ${schoolId}`);
  } catch (error) {
    console.error("❌ Error initializing school setup:", error);
  }
};
