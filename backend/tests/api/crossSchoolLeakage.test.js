import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createActiveAcademicYear, loginAs } from '../helpers/fixtures.js';
import { Student } from '../../src/models/student.model.js';
import { School } from '../../src/models/school.model.js';
import { FeeStructure } from '../../src/models/feeStructure.model.js';
import { StudentFee } from '../../src/models/studentFee.model.js';
import { ExamResult } from '../../src/models/ExamResult.model.js';
import { SchoolClass } from '../../src/models/schoolClass.model.js';
import { AcademicYear } from '../../src/models/AcademicYear.model.js';
import { PTMSession } from '../../src/models/PTMSession.model.js';
import { PTMSlot } from '../../src/models/PTMSlot.model.js';
import { FeeHead } from '../../src/models/feeHead.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('POST /student-fees/assign', () => {
  it('cannot assign fees to a student in a different school, even if that school id is passed in the body', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    const accountantRole = await createRole('Accountant', { schoolId: schoolA._id });
    const { user: accountant } = await createUser({
      name: 'Accountant A',
      email: 'accountant@schoolA.test',
      roleId: accountantRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(accountant.email);

    // A fee structure and a student that both genuinely belong to School B.
    const feeStructure = await FeeStructure.create({
      schoolId: schoolB._id,
      schoolClassId: new mongoose.Types.ObjectId(),
      academicYearId: new mongoose.Types.ObjectId(),
      feeHeadId: new mongoose.Types.ObjectId(),
      amount: 5000,
      frequency: 'monthly',
    });
    const studentRoleB = await createRole('Student', { schoolId: schoolB._id });
    const { user: studentUserB } = await createUser({
      name: 'Student B',
      email: 'student@schoolB.test',
      roleId: studentRoleB._id,
      schoolId: schoolB._id,
    });
    const studentB = await Student.create({ userId: studentUserB._id, schoolId: schoolB._id });

    const response = await request(app)
      .post('/api/v1/student-fees/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        feeStructureId: feeStructure._id.toString(),
        studentIds: [studentB._id.toString()],
        academicYearId: new mongoose.Types.ObjectId().toString(),
        schoolId: schoolB._id.toString(),
      });

    // Either rejected outright, or silently drops the foreign student — either way, no
    // cross-school StudentFee record may be created.
    expect(response.status).toBeGreaterThanOrEqual(400);
    const created = await StudentFee.find({ studentId: studentB._id });
    expect(created).toHaveLength(0);
  }, 15000);

  it('still assigns fees normally to a student within the caller\'s own school', async () => {
    const school = await createSchool();

    const accountantRole = await createRole('Accountant', { schoolId: school._id });
    const { user: accountant } = await createUser({
      name: 'Accountant',
      email: 'accountant@school.test',
      roleId: accountantRole._id,
      schoolId: school._id,
    });
    const token = await loginAs(accountant.email);

    const feeStructure = await FeeStructure.create({
      schoolId: school._id,
      schoolClassId: new mongoose.Types.ObjectId(),
      academicYearId: new mongoose.Types.ObjectId(),
      feeHeadId: new mongoose.Types.ObjectId(),
      amount: 5000,
      frequency: 'monthly',
    });
    const studentRole = await createRole('Student', { schoolId: school._id });
    const { user: studentUser } = await createUser({
      name: 'Own Student',
      email: 'ownstudent@school.test',
      roleId: studentRole._id,
      schoolId: school._id,
    });
    const student = await Student.create({ userId: studentUser._id, schoolId: school._id });

    const response = await request(app)
      .post('/api/v1/student-fees/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        feeStructureId: feeStructure._id.toString(),
        studentIds: [student._id.toString()],
        academicYearId: new mongoose.Types.ObjectId().toString(),
      });

    expect(response.status).toBe(201);
    const created = await StudentFee.find({ studentId: student._id, schoolId: school._id });
    expect(created).toHaveLength(1);
  }, 15000);
});

describe('GET /exams/results/student/:studentId', () => {
  it('a teacher in one school cannot fetch exam results for a student in another school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    const teacherRole = await createRole('Teacher', { schoolId: schoolA._id });
    const { user: teacher } = await createUser({
      name: 'Teacher A',
      email: 'teacher@schoolA.test',
      roleId: teacherRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(teacher.email);

    const studentRoleB = await createRole('Student', { schoolId: schoolB._id });
    const { user: studentUserB } = await createUser({
      name: 'Student B',
      email: 'student2@schoolB.test',
      roleId: studentRoleB._id,
      schoolId: schoolB._id,
    });

    await ExamResult.create({
      schoolId: schoolB._id,
      academicYearId: new mongoose.Types.ObjectId(),
      examId: new mongoose.Types.ObjectId(),
      studentId: studentUserB._id,
      schoolClassId: new mongoose.Types.ObjectId(),
      subjects: [{ subjectId: new mongoose.Types.ObjectId(), obtainedMarks: 80, totalMarks: 100, passingMarks: 33, isPassed: true }],
      totalObtainedMarks: 80,
      totalMaximumMarks: 100,
      percentage: 80,
      grade: 'A',
      resultStatus: 'PASS',
      isPublished: true,
    });

    const response = await request(app)
      .get(`/api/v1/exams/results/student/${studentUserB._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  }, 15000);

  it('a teacher can still fetch exam results for a student in their own school', async () => {
    const school = await createSchool();

    const teacherRole = await createRole('Teacher', { schoolId: school._id });
    const { user: teacher } = await createUser({
      name: 'Teacher',
      email: 'teacher@school.test',
      roleId: teacherRole._id,
      schoolId: school._id,
    });
    const token = await loginAs(teacher.email);

    const studentRole = await createRole('Student', { schoolId: school._id });
    const { user: studentUser } = await createUser({
      name: 'Own Student',
      email: 'ownstudent2@school.test',
      roleId: studentRole._id,
      schoolId: school._id,
    });

    await ExamResult.create({
      schoolId: school._id,
      academicYearId: new mongoose.Types.ObjectId(),
      examId: new mongoose.Types.ObjectId(),
      studentId: studentUser._id,
      schoolClassId: new mongoose.Types.ObjectId(),
      subjects: [{ subjectId: new mongoose.Types.ObjectId(), obtainedMarks: 90, totalMarks: 100, passingMarks: 33, isPassed: true }],
      totalObtainedMarks: 90,
      totalMaximumMarks: 100,
      percentage: 90,
      grade: 'A+',
      resultStatus: 'PASS',
      isPublished: true,
    });

    const response = await request(app)
      .get(`/api/v1/exams/results/student/${studentUser._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  }, 15000);
});

describe('POST /school-class (create)', () => {
  it('ignores a spoofed schoolId in the body and creates the class under the caller\'s own school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const academicYearB = await createActiveAcademicYear({ schoolId: schoolB._id });

    const adminRole = await createRole('School Admin', { schoolId: schoolA._id });
    const { user: admin } = await createUser({
      name: 'Admin A',
      email: 'admin@schoolA.test',
      roleId: adminRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .post('/api/v1/school-class')
      .set('Authorization', `Bearer ${token}`)
      .send({
        schoolId: schoolB._id.toString(),
        academicYearId: academicYearB._id.toString(),
        boardClassId: new mongoose.Types.ObjectId().toString(),
        name: 'Class 5',
      });

    // Whatever the outcome, no class may be created under School B's id.
    const createdUnderB = await SchoolClass.find({ schoolId: schoolB._id });
    expect(createdUnderB).toHaveLength(0);
    if (response.status === 201) {
      expect(response.body.data.schoolId.toString()).toBe(schoolA._id.toString());
    }
  }, 15000);
});

describe('GET /school-class (list)', () => {
  it('a teacher cannot list another school\'s classes by passing its schoolId as a query param', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const academicYearB = await createActiveAcademicYear({ schoolId: schoolB._id });

    await SchoolClass.create({
      schoolId: schoolB._id,
      academicYearId: academicYearB._id,
      boardClassId: new mongoose.Types.ObjectId(),
      name: 'Secret Class B',
    });

    const teacherRole = await createRole('Teacher', { schoolId: schoolA._id });
    const { user: teacher } = await createUser({
      name: 'Teacher A',
      email: 'teacherclass@schoolA.test',
      roleId: teacherRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(teacher.email);

    const response = await request(app)
      .get(`/api/v1/school-class?schoolId=${schoolB._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  }, 15000);
});

describe('POST /academicYear/create', () => {
  it('ignores a spoofed schoolId in the body and creates the academic year under the caller\'s own school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    const adminRole = await createRole('School Admin', { schoolId: schoolA._id });
    const { user: admin } = await createUser({
      name: 'Admin A',
      email: 'admin2@schoolA.test',
      roleId: adminRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .post('/api/v1/academicYear/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        schoolId: schoolB._id.toString(),
        startDate: '2025-06-01',
        endDate: '2026-04-30',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.schoolId.toString()).toBe(schoolA._id.toString());
    const createdUnderB = await AcademicYear.find({ schoolId: schoolB._id });
    expect(createdUnderB).toHaveLength(0);
  }, 15000);
});

describe('GET /academicYear/school/:schoolId', () => {
  it('a student cannot list another school\'s academic years by editing the URL', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    await createActiveAcademicYear({ schoolId: schoolB._id });

    const studentRole = await createRole('Student', { schoolId: schoolA._id });
    const { user: studentUser } = await createUser({
      name: 'Student A',
      email: 'studentyear@schoolA.test',
      roleId: studentRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(studentUser.email);

    const response = await request(app)
      .get(`/api/v1/academicYear/school/${schoolB._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  }, 15000);
});

describe('POST /ptm/slots/:id/book', () => {
  it('a parent cannot book a PTM slot that belongs to a different school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    const parentRole = await createRole('Parent', { schoolId: schoolA._id });
    const { user: parent } = await createUser({
      name: 'Parent A',
      email: 'parent@schoolA.test',
      roleId: parentRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(parent.email);

    const studentRoleA = await createRole('Student', { schoolId: schoolA._id });
    const { user: childUser } = await createUser({
      name: 'Child A',
      email: 'child@schoolA.test',
      roleId: studentRoleA._id,
      schoolId: schoolA._id,
    });
    const child = await Student.create({ userId: childUser._id, schoolId: schoolA._id, fatherId: parent._id });

    const staffUserB = new mongoose.Types.ObjectId();
    const sessionB = await PTMSession.create({
      schoolId: schoolB._id,
      title: 'PTM Session B',
      schoolClassId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      createdBy: staffUserB,
    });
    const slotB = await PTMSlot.create({
      ptmSessionId: sessionB._id,
      schoolId: schoolB._id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 600000),
      status: 'Available',
    });

    const response = await request(app)
      .post(`/api/v1/ptm/slots/${slotB._id}/book`)
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId: child._id.toString() });

    expect(response.status).toBeGreaterThanOrEqual(400);
    const unchangedSlot = await PTMSlot.findById(slotB._id).lean();
    expect(unchangedSlot.status).toBe('Available');
  }, 15000);
});

describe('POST /fee-structures (create)', () => {
  it('ignores a spoofed schoolId in the body and creates the fee structure under the caller\'s own school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    const adminRole = await createRole('School Admin', { schoolId: schoolA._id });
    const { user: admin } = await createUser({
      name: 'Admin A',
      email: 'admin@schoolA-fs.test',
      roleId: adminRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .post('/api/v1/fee-structures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        schoolId: schoolB._id.toString(),
        schoolClassId: new mongoose.Types.ObjectId().toString(),
        academicYearId: new mongoose.Types.ObjectId().toString(),
        feeHeadId: new mongoose.Types.ObjectId().toString(),
        amount: 5000,
        frequency: 'monthly',
      });

    const createdUnderB = await FeeStructure.find({ schoolId: schoolB._id });
    expect(createdUnderB).toHaveLength(0);
    if (response.status === 201) {
      expect(response.body.data.schoolId.toString()).toBe(schoolA._id.toString());
    }
  }, 15000);
});

describe('POST /fee-heads (create)', () => {
  it('ignores a spoofed schoolId in the body and creates the fee head under the caller\'s own school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    const adminRole = await createRole('School Admin', { schoolId: schoolA._id });
    const { user: admin } = await createUser({
      name: 'Admin A',
      email: 'admin@schoolA-fh.test',
      roleId: adminRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .post('/api/v1/fee-heads')
      .set('Authorization', `Bearer ${token}`)
      .send({ schoolId: schoolB._id.toString(), name: 'Tuition Fee', type: 'recurring', isEditable: true });

    expect(response.status).toBe(201);
    expect(response.body.data.schoolId.toString()).toBe(schoolA._id.toString());
    const createdUnderB = await FeeHead.find({ schoolId: schoolB._id });
    expect(createdUnderB).toHaveLength(0);
  }, 15000);

  it('an Accountant (previously fell through the req.Role typo bug) is also locked to their own school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    const accountantRole = await createRole('Accountant', { schoolId: schoolA._id });
    const { user: accountant } = await createUser({
      name: 'Accountant A',
      email: 'accountant@schoolA-fh.test',
      roleId: accountantRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(accountant.email);

    const response = await request(app)
      .post('/api/v1/fee-heads')
      .set('Authorization', `Bearer ${token}`)
      .send({ schoolId: schoolB._id.toString(), name: 'Library Fee', type: 'one-time', isEditable: true });

    expect(response.status).toBe(201);
    expect(response.body.data.schoolId.toString()).toBe(schoolA._id.toString());
  }, 15000);
});

describe('POST /school/update/:schoolId', () => {
  it('refuses a School Admin editing a school that is not their own', async () => {
    const schoolA = await createSchool({ name: 'School A' });
    const schoolB = await createSchool({ name: 'School B' });

    const adminRole = await createRole('School Admin', { schoolId: schoolA._id });
    const { user: admin } = await createUser({
      name: 'Admin A',
      email: 'admin@schoolA-upd.test',
      roleId: adminRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .post(`/api/v1/school/update/${schoolB._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hijacked', admissionsOpen: false });

    expect(response.status).toBe(403);

    const untouched = await School.findById(schoolB._id);
    expect(untouched.name).toBe('School B');
    expect(untouched.admissionsOpen).toBe(true);
  }, 15000);

  it('still lets a School Admin update their own school, including the admissions toggle', async () => {
    const school = await createSchool({ name: 'My School' });

    const adminRole = await createRole('School Admin', { schoolId: school._id });
    const { user: admin } = await createUser({
      name: 'Admin',
      email: 'admin@ownschool-upd.test',
      roleId: adminRole._id,
      schoolId: school._id,
    });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .post(`/api/v1/school/update/${school._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '9876500000', admissionsOpen: false });

    expect(response.status).toBe(200);

    const updated = await School.findById(school._id);
    expect(updated.phone).toBe('9876500000');
    expect(updated.admissionsOpen).toBe(false);
  }, 15000);
});

describe('GET /school/:schoolId', () => {
  it('refuses a Student reading a school that is not their own', async () => {
    const schoolA = await createSchool({ name: 'School A' });
    const schoolB = await createSchool({ name: 'School B' });

    const studentRole = await createRole('Student', { schoolId: schoolA._id });
    const { user: student } = await createUser({
      name: 'Student A',
      email: 'student@schoolA-get.test',
      roleId: studentRole._id,
      schoolId: schoolA._id,
    });
    const token = await loginAs(student.email);

    const response = await request(app)
      .get(`/api/v1/school/${schoolB._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).not.toMatch(/School B/);
  }, 15000);

  it('still lets a Student read their own school', async () => {
    const school = await createSchool({ name: 'My School' });

    const studentRole = await createRole('Student', { schoolId: school._id });
    const { user: student } = await createUser({
      name: 'Student',
      email: 'student@ownschool-get.test',
      roleId: studentRole._id,
      schoolId: school._id,
    });
    const token = await loginAs(student.email);

    const response = await request(app)
      .get(`/api/v1/school/${school._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('My School');
    // Financial details stay excluded even for your own school.
    expect(response.body.data.bank).toBeUndefined();
  }, 15000);
});
