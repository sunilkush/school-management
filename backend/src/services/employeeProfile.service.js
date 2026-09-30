import { Employee } from "../models/Employee.model.js";
import { PayrollStructure } from "../models/payrollStructure.model.js";
import { Role } from "../models/Roles.model.js";
import { User } from "../models/user.model.js";
import { highestSuffix, nextSequence } from "../utils/sequence.js";

/**
 * Who is on a school's payroll: everyone who works there. That is every role except the
 * families (Student, Parent) and the platform's own Super Admin — the School Admin included.
 *
 * A user account on its own has no payroll record: salary structures, payroll runs and payslips
 * all hang off an Employee. Staff added as users (rather than through Payroll → Employees) had
 * none, so they were left out of every payroll run and saw "profile not set up" on My Payroll.
 */
export const NOT_ON_PAYROLL_ROLES = ["Student", "Parent", "Super Admin"];

export const isPayrollRoleName = (name) => Boolean(name) && !NOT_ON_PAYROLL_ROLES.includes(String(name));

/** The school's next employee code (EMP0001, …) from the same atomic counter registration uses. */
export const nextEmployeeCode = async (schoolId) =>
  `EMP${String(
    await nextSequence(`empcode:${schoolId}`, async () => {
      const issued = await Employee.find({ schoolId }).select("employeeCode").lean();
      return highestSuffix(issued.map((e) => e.employeeCode).filter((c) => String(c || "").startsWith("EMP")), "EMP");
    })
  ).padStart(4, "0")}`;

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
 * Every employee gets a salary structure row to fill in. The amounts are not known here, so it
 * is created as a ₹0 draft: it shows in Salary Structures for the office to complete and make
 * active, and a draft is never used by a payroll run (runs read active structures only), so
 * nobody is paid ₹0 by mistake.
 */
const ensureDraftStructure = async (employee) => {
  if (await PayrollStructure.exists({ schoolId: employee.schoolId, employeeId: employee._id })) return false;
  await PayrollStructure.create({
    schoolId: employee.schoolId,
    employeeId: employee._id,
    basic: 0,
    grossMonthly: 0,
    effectiveFrom: employee.joinDate || new Date(),
    status: "draft",
  });
  return true;
};

const createEmployeeFor = async (user) =>
  Employee.create({
    userId: user._id,
    schoolId: user.schoolId,
    academicYearId: user.academicYearId || undefined,
    employeeCode: await nextEmployeeCode(user.schoolId),
    ...profileFromUser(user),
  });

/**
 * Makes sure this user is on their school's payroll, when their role is one that is: an employee
 * record and a draft salary structure. Does nothing for families or Super Admin, or for what
 * already exists. Returns the employee record it created, or null.
 */
export const ensureEmployeeProfile = async (user) => {
  if (!user?._id || !user.schoolId) return null;
  const role = user.roleId?.name ? user.roleId : await Role.findById(user.roleId).select("name").lean();
  if (!isPayrollRoleName(role?.name)) return null;

  const existing = await Employee.findOne({ schoolId: user.schoolId, userId: user._id });
  const employee = existing || (await createEmployeeFor(user));
  await ensureDraftStructure(employee);
  return existing ? null : employee;
};

/**
 * Puts every active staff user of the school on payroll: an employee record for those without
 * one, and a draft salary structure for every staff employee without any structure.
 * Safe to run again. Returns { added, structuresAdded, eligible }.
 */
export const addMissingStaffToPayroll = async (schoolId) => {
  const roleIds = await Role.find({ name: { $nin: NOT_ON_PAYROLL_ROLES } }).distinct("_id");
  const staff = await User.find({ schoolId, roleId: { $in: roleIds }, isActive: true, isDeleted: { $ne: true } }).lean();
  const employees = await Employee.find({ schoolId, userId: { $in: staff.map((u) => u._id) } });
  const byUser = new Map(employees.map((e) => [String(e.userId), e]));

  const added = [];
  let structuresAdded = 0;
  for (const user of staff) {
    let employee = byUser.get(String(user._id));
    if (!employee) {
      // eslint-disable-next-line no-await-in-loop
      employee = await createEmployeeFor({ ...user, schoolId });
      added.push({ employeeId: employee._id, userId: user._id, name: user.name, employeeCode: employee.employeeCode });
    }
    // eslint-disable-next-line no-await-in-loop
    if (await ensureDraftStructure(employee)) structuresAdded += 1;
  }

  return { added, structuresAdded, eligible: staff.length };
};
