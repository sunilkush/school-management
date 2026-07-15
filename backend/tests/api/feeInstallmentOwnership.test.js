import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createStudent, createStudentFee, loginAs } from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('GET /fee-installments — ownership enforcement', () => {
  it("blocks a Student from reading another student's installments", async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const { user: userA } = await createUser({ name: 'Student A', email: 'a@school.test', roleId: studentRole._id, schoolId: school._id });
    const { user: userB } = await createUser({ name: 'Student B', email: 'b@school.test', roleId: studentRole._id, schoolId: school._id });
    const studentA = await createStudent({ userId: userA._id, schoolId: school._id });
    await createStudent({ userId: userB._id, schoolId: school._id });
    await createStudentFee({ schoolId: school._id, studentId: studentA._id, totalAmount: 1000 });

    const tokenB = await loginAs(userB.email);

    const response = await request(app)
      .get('/api/v1/fee-installments')
      .query({ studentId: studentA._id.toString() })
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(403);
  });

  it('lets a Student read their own installments', async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const { user: userA } = await createUser({ name: 'Student A', email: 'a@school.test', roleId: studentRole._id, schoolId: school._id });
    const studentA = await createStudent({ userId: userA._id, schoolId: school._id });
    await createStudentFee({ schoolId: school._id, studentId: studentA._id, totalAmount: 1000 });
    const tokenA = await loginAs(userA.email);

    const response = await request(app)
      .get('/api/v1/fee-installments')
      .query({ studentId: studentA._id.toString() })
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
  });
});

describe('POST /fee-installments/generate — ownership enforcement', () => {
  it("blocks a Parent from generating installments for a student who isn't their child", async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const parentRole = await createRole('Parent');
    const { user: studentUser } = await createUser({ name: 'Some Student', email: 'student@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id }); // no fatherId/motherId
    const { user: parentUser } = await createUser({ name: 'Unrelated Parent', email: 'parent@school.test', roleId: parentRole._id, schoolId: school._id });
    await createStudentFee({ schoolId: school._id, studentId: student._id, totalAmount: 1200 });
    const parentToken = await loginAs(parentUser.email);

    const response = await request(app)
      .post('/api/v1/fee-installments/generate')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentId: student._id.toString(), academicYearId: null });

    expect(response.status).toBe(403);
  });

  it('lets a Parent generate installments for their own linked child', async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const parentRole = await createRole('Parent');
    const { user: studentUser } = await createUser({ name: 'Child', email: 'child@school.test', roleId: studentRole._id, schoolId: school._id });
    const { user: parentUser } = await createUser({ name: 'Parent', email: 'parent@school.test', roleId: parentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id, fatherId: parentUser._id });
    await createStudentFee({ schoolId: school._id, studentId: student._id, totalAmount: 1200 });
    const parentToken = await loginAs(parentUser.email);

    const response = await request(app)
      .post('/api/v1/fee-installments/generate')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentId: student._id.toString() });

    expect(response.status).toBe(201);
  });
});
