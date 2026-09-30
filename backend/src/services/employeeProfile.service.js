import { Employee } from "../models/Employee.model.js";
import { Role } from "../models/Roles.model.js";
import { User } from "../models/user.model.js";
import { highestSuffix, nextSequence } from "../utils/sequence.js";

/**
 * Staff who are paid by the school and so belong on payroll. Kept to the roles that can open
 * "My Payroll" (EMPLOYEE_SELF_ROLES in routes/payroll.routes.js); students, parents and the
 * platform's Super Admin are not employees of a school.
 *
 * A user account on its own has no payroll record: salary structures, payroll runs and payslips
 * all hang off an Employee. Staff added as users (rather than through Payroll → Employees) had
 * none, so they were left out of every payroll run and saw "profile not set up" on My Payroll.
 */
export const PAYROLL_ELIGIBLE_ROLES = [
  "School Admin", "Principal", "Vice Principal", "Accountant",
  "Teacher", "Class Teacher", "Sports Teacher", "Lab Technician", "Medical Officer",
  "Employee", "Staff", "Support Staff", "Librarian", "Hostel Warden", "Transport Manager",
  "Exam Coordinator", "Subject Coordinator", "Receptionist", "IT Support", "Counselor",
  "Security", "Driver",
];

/** The school's next employee code (EMP0001, …) from the same atomic counter registration uses. */
export const nextEmployeeCode = async (schoolId) =>
  `EMP${String(
    await nextSequence(`empcode:${schoolId}`, async () => {
      const issued = await Employee.find({ schoolId }).select("employeeCode").lean();
      return highestSuffix(issued.map((e) => e.employeeCode).filter((c) => String(c || "").startsWith("EMP")), "EMP");
    })
  ).padStart(4, "0")}`;

const isEligibleRoleName = (name) => PAYROLL_ELIGIBLE_ROLES.includes(String(name || ""));

// Only what the user account already knows. Phone and gender are kept if valid; the join date is
// the user's joining date, or when the account was made. The school office fills in the rest
// (bank details, statutory numbers) on the employee record before the first payroll run.
const profileFromUser = (user) => {
  const phone = String(user.phone || "").replace(/[\s-]/g, "");
  return {
    ...(/^\+?[0-9]{10,13}$/.test(phone) ? { phoneNo: phone } : {}),
    ...(["Male", "Female", "Other"].includes(user.gender) ? { gender: user.gender } : {}),
    ...(user.dateOfBirth ? { dateOfBirth: user.dateOfBirth } : {}),
    joinDate: user.joiningDate || user.createdAt || new Date(),
  };
};

/**
 * Makes sure this user has an employee record in their school, when their role is paid staff.
 * Does nothing for other roles or when a record already exists. Returns the record it created,
 * or null.
 */
export const ensureEmployeeProfile = async (user) => {
  if (!user?._id || !user.schoolId) return null;
  const role = user.roleId?.name ? user.roleId : await Role.findById(user.roleId).select("name").lean();
  if (!isEligibleRoleName(role?.name)) return null;
  if (await Employee.exists({ schoolId: user.schoolId, userId: user._id })) return null;

  return Employee.create({
    userId: user._id,
    schoolId: user.schoolId,
    academicYearId: user.academicYearId || undefined,
    employeeCode: await nextEmployeeCode(user.schoolId),
    ...profileFromUser(user),
  });
};

/**
 * Adds every active paid-staff user of the school who has no employee record yet.
 * Returns { added, alreadyOnPayroll, eligible }.
 */
export const addMissingStaffToPayroll = async (schoolId) => {
  const roleIds = await Role.find({ name: { $in: PAYROLL_ELIGIBLE_ROLES } }).distinct("_id");
  const staff = await User.find({ schoolId, roleId: { $in: roleIds }, isActive: true, isDeleted: { $ne: true } }).lean();
  const onPayroll = new Set((await Employee.find({ schoolId, userId: { $in: staff.map((u) => u._id) } }).distinct("userId")).map(String));

  const added = [];
  for (const user of staff) {
    if (onPayroll.has(String(user._id))) continue;
    // eslint-disable-next-line no-await-in-loop
    const employee = await Employee.create({
      userId: user._id,
      schoolId,
      academicYearId: user.academicYearId || undefined,
      employeeCode: await nextEmployeeCode(schoolId),
      ...profileFromUser(user),
    });
    added.push({ employeeId: employee._id, userId: user._id, name: user.name, employeeCode: employee.employeeCode });
  }

  return { added, alreadyOnPayroll: onPayroll.size, eligible: staff.length };
};
