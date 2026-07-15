import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app.js';
import { Section } from '../../src/models/section.model.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool,
  createRole,
  createUser,
  createStudent,
  createActiveAcademicYear,
  createEnrollment,
  loginAs,
} from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('GET /student/all', () => {
  it('projects a real Student._id (studentId) distinct from the row\'s own StudentEnrollment._id', async () => {
    const school = await createSchool();
    const academicYear = await createActiveAcademicYear({ schoolId: school._id });
    const studentRole = await createRole('Student');
    const adminRole = await createRole('School Admin');

    const { user: studentUser } = await createUser({ name: 'Aarav', email: 'aarav@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id });
    const enrollment = await createEnrollment({ studentId: student._id, schoolId: school._id, academicYearId: academicYear._id });

    const { user: adminUser } = await createUser({ name: 'Admin', email: 'admin@school.test', roleId: adminRole._id, schoolId: school._id });
    const token = await loginAs(adminUser.email);

    const response = await request(app)
      .get('/api/v1/student/all')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const row = response.body.data.students.find((s) => s._id === enrollment._id.toString());
    expect(row).toBeDefined();
    // The row's own _id is the StudentEnrollment id, not the Student id — they must differ, and
    // studentId must be the real Student._id a client can pass to GET /student/getStudent/:id.
    expect(row._id).not.toBe(student._id.toString());
    expect(row.studentId).toBe(student._id.toString());
  });

  it('never returns the same row on two different pages, even when several enrollments share an identical createdAt (bulk class-promotion inserts)', async () => {
    const school = await createSchool();
    const academicYear = await createActiveAcademicYear({ schoolId: school._id });
    const studentRole = await createRole('Student');
    const adminRole = await createRole('School Admin');

    // Simulates StudentEnrollment.insertMany() from a class-promotion batch — every doc gets the
    // same createdAt, which is exactly what made {$sort: {createdAt: -1}} alone an unstable order
    // across separate page requests.
    const sharedCreatedAt = new Date('2025-06-01T00:00:00.000Z');
    const enrollmentIds = [];
    for (let i = 0; i < 3; i += 1) {
      const { user: studentUser } = await createUser({
        name: `Student${i}`,
        email: `student${i}@school.test`,
        roleId: studentRole._id,
        schoolId: school._id,
      });
      const student = await createStudent({ userId: studentUser._id, schoolId: school._id });
      const enrollment = await createEnrollment({
        studentId: student._id,
        schoolId: school._id,
        academicYearId: academicYear._id,
        createdAt: sharedCreatedAt,
      });
      enrollmentIds.push(enrollment._id.toString());
    }

    const { user: adminUser } = await createUser({ name: 'Admin', email: 'admin@school.test', roleId: adminRole._id, schoolId: school._id });
    const token = await loginAs(adminUser.email);

    const page1 = await request(app)
      .get('/api/v1/student/all')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${token}`);
    const page2 = await request(app)
      .get('/api/v1/student/all')
      .query({ page: 2, limit: 2 })
      .set('Authorization', `Bearer ${token}`);

    const page1Ids = page1.body.data.students.map((s) => s._id);
    const page2Ids = page2.body.data.students.map((s) => s._id);
    const combinedIds = [...page1Ids, ...page2Ids];

    expect(combinedIds).toHaveLength(3);
    expect(new Set(combinedIds).size).toBe(3); // no row appears on both pages
    expect(new Set(combinedIds)).toEqual(new Set(enrollmentIds));
  });

  it('projects sectionName and status, and filters by sectionId', async () => {
    const school = await createSchool();
    const academicYear = await createActiveAcademicYear({ schoolId: school._id });
    const studentRole = await createRole('Student');
    const adminRole = await createRole('School Admin');
    const schoolClassId = new mongoose.Types.ObjectId();

    const sectionA = await Section.create({ schoolId: school._id, schoolClassId, academicYearId: academicYear._id, name: 'A' });
    const sectionB = await Section.create({ schoolId: school._id, schoolClassId, academicYearId: academicYear._id, name: 'B' });

    const { user: userA } = await createUser({ name: 'Aarav', email: 'aarav@school.test', roleId: studentRole._id, schoolId: school._id });
    const studentA = await createStudent({ userId: userA._id, schoolId: school._id });
    const enrollmentA = await createEnrollment({
      studentId: studentA._id,
      schoolId: school._id,
      academicYearId: academicYear._id,
      schoolClassId,
      sectionId: sectionA._id,
      status: 'Active',
    });

    const { user: userB } = await createUser({ name: 'Bhavna', email: 'bhavna@school.test', roleId: studentRole._id, schoolId: school._id });
    const studentB = await createStudent({ userId: userB._id, schoolId: school._id });
    await createEnrollment({
      studentId: studentB._id,
      schoolId: school._id,
      academicYearId: academicYear._id,
      schoolClassId,
      sectionId: sectionB._id,
      status: 'Alumni',
    });

    const { user: adminUser } = await createUser({ name: 'Admin', email: 'admin@school.test', roleId: adminRole._id, schoolId: school._id });
    const token = await loginAs(adminUser.email);

    const response = await request(app)
      .get('/api/v1/student/all')
      .query({ sectionId: sectionA._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.students).toHaveLength(1);
    const row = response.body.data.students[0];
    expect(row._id).toBe(enrollmentA._id.toString());
    expect(row.sectionName).toBe('A');
    expect(row.status).toBe('Active');
  });
});
