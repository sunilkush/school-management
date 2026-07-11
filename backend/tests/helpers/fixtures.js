import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app.js';
import { School } from '../../src/models/school.model.js';
import { Role } from '../../src/models/Roles.model.js';
import { User } from '../../src/models/user.model.js';
import { Student } from '../../src/models/student.model.js';
import { StudentFee } from '../../src/models/studentFee.model.js';
import { AcademicYear } from '../../src/models/AcademicYear.model.js';
import { StudentEnrollment } from '../../src/models/StudentEnrollment.model.js';

const PLAIN_PASSWORD = 'Password123!';

let schoolCounter = 0;

export async function createSchool(overrides = {}) {
  schoolCounter += 1;
  return School.create({ name: 'Test School', email: `school${schoolCounter}@test.example`, ...overrides });
}

let roleCounter = 0;

// Roles.model.js has a unique index on {code, schoolId} — every doc that leaves `code` unset
// stores it as the same missing/null value, so a second such role (common across tests, and
// especially across a full suite run where enough inserts accumulate for the async index build
// to finish and start actually enforcing it) throws E11000. Always generate a unique code here.
export async function createRole(name, overrides = {}) {
  roleCounter += 1;
  return Role.create({ name, type: 'system', code: `TEST-${roleCounter}`, ...overrides });
}

/** Creates a User with a real bcrypt-hashed password (via the model's pre-save hook) so the real
 * POST /user/login endpoint can authenticate as this user in a test. */
export async function createUser({ name, email, roleId, schoolId, password = PLAIN_PASSWORD, ...overrides }) {
  const user = await User.create({ name, email, password, roleId, schoolId, isActive: true, ...overrides });
  return { user, password };
}

export async function createStudent({ userId, schoolId, ...overrides }) {
  return Student.create({ userId, schoolId, ...overrides });
}

export async function createActiveAcademicYear({ schoolId, ...overrides }) {
  return AcademicYear.create({
    schoolId,
    name: '2025-2026',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2026-04-30'),
    isActive: true,
    status: 'active',
    ...overrides,
  });
}

let enrollmentCounter = 0;

export async function createEnrollment({ studentId, schoolId, academicYearId, schoolClassId, sectionId, ...overrides }) {
  enrollmentCounter += 1;
  return StudentEnrollment.create({
    studentId,
    schoolId,
    academicYearId,
    schoolClassId: schoolClassId ?? new mongoose.Types.ObjectId(),
    sectionId: sectionId ?? new mongoose.Types.ObjectId(),
    registrationNumber: `REG-${enrollmentCounter}`,
    admissionDate: new Date(),
    status: 'Active',
    ...overrides,
  });
}

/** feeStructureId/academicYearId are refs the payment/fee code under test never dereferences, so
 * a fresh dummy ObjectId is enough — no need to build out the full FeeStructure/AcademicYear chain. */
export async function createStudentFee({ schoolId, studentId, totalAmount, paidAmount = 0, ...overrides }) {
  return StudentFee.create({
    schoolId,
    studentId,
    academicYearId: overrides.academicYearId ?? new mongoose.Types.ObjectId(),
    feeStructureId: overrides.feeStructureId ?? new mongoose.Types.ObjectId(),
    totalAmount,
    paidAmount,
    dueAmount: totalAmount - paidAmount,
  });
}

/** Logs in via the real endpoint (exercising bcrypt.compare + JWT signing for real) and returns the access token. */
export async function loginAs(email, password = PLAIN_PASSWORD) {
  const response = await request(app).post('/api/v1/user/login').send({ email, password });
  if (response.status !== 200) {
    throw new Error(`loginAs(${email}) failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.data.accessToken;
}

export { PLAIN_PASSWORD };
