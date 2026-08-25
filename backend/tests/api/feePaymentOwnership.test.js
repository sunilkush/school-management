import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createStudent, createStudentFee, loginAs, PLAIN_PASSWORD } from '../helpers/fixtures.js';
import { StudentFee } from '../../src/models/studentFee.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('PUT /student-fees/pay/:id — staff-only, self-service payment moved to /payments', () => {
  it("blocks a Student from paying another student's fee record, and leaves it unchanged", async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');

    const { user: userA } = await createUser({ name: 'Student A', email: 'a@school.test', roleId: studentRole._id, schoolId: school._id });
    const { user: userB } = await createUser({ name: 'Student B', email: 'b@school.test', roleId: studentRole._id, schoolId: school._id });
    const studentA = await createStudent({ userId: userA._id, schoolId: school._id });
    await createStudent({ userId: userB._id, schoolId: school._id });

    const fee = await createStudentFee({ schoolId: school._id, studentId: studentA._id, totalAmount: 1000 });

    const tokenB = await loginAs(userB.email);

    const response = await request(app)
      .put(`/api/v1/student-fees/pay/${fee._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ paidAmount: 1000, paymentMode: 'cash' });

    expect(response.status).toBe(403);

    const unchanged = await StudentFee.findById(fee._id);
    expect(unchanged.paidAmount).toBe(0);
    expect(unchanged.status).toBe('pending');
  }, 15000);

  it('rejects even the rightful Student — self-service now only goes through gateway-verified /payments, not this staff endpoint (closes the self-reported-cash fraud gap)', async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');

    const { user: userA } = await createUser({ name: 'Student A', email: 'a@school.test', roleId: studentRole._id, schoolId: school._id });
    const studentA = await createStudent({ userId: userA._id, schoolId: school._id });
    const fee = await createStudentFee({ schoolId: school._id, studentId: studentA._id, totalAmount: 1000 });

    const tokenA = await loginAs(userA.email, PLAIN_PASSWORD);

    const response = await request(app)
      .put(`/api/v1/student-fees/pay/${fee._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ paidAmount: 1000, paymentMode: 'cash' });

    expect(response.status).toBe(403);
    const unchanged = await StudentFee.findById(fee._id);
    expect(unchanged.paidAmount).toBe(0);
  }, 15000);

  it("blocks a Parent from paying any fee record through this staff endpoint", async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const parentRole = await createRole('Parent');

    const { user: studentUser } = await createUser({ name: 'Some Student', email: 'student@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id }); // no fatherId/motherId/guardianId set
    const { user: parentUser } = await createUser({ name: 'Unrelated Parent', email: 'parent@school.test', roleId: parentRole._id, schoolId: school._id });

    const fee = await createStudentFee({ schoolId: school._id, studentId: student._id, totalAmount: 500 });
    const parentToken = await loginAs(parentUser.email);

    const response = await request(app)
      .put(`/api/v1/student-fees/pay/${fee._id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ paidAmount: 500, paymentMode: 'cash' });

    expect(response.status).toBe(403);
  }, 15000);

  it('still lets an Accountant collect a fee, and it updates via the shared payment service', async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const accountantRole = await createRole('Accountant');

    const { user: studentUser } = await createUser({ name: 'Some Student', email: 'student2@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id });
    const { user: accountant } = await createUser({ name: 'Accountant', email: 'accountant@school.test', roleId: accountantRole._id, schoolId: school._id });

    const fee = await createStudentFee({ schoolId: school._id, studentId: student._id, totalAmount: 1000 });
    const token = await loginAs(accountant.email);

    const response = await request(app)
      .put(`/api/v1/student-fees/pay/${fee._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: 1000, paymentMode: 'cash' });

    expect(response.status).toBe(200);
    const updated = await StudentFee.findById(fee._id);
    expect(updated.status).toBe('paid');
    expect(updated.paidAmount).toBe(1000);
    expect(updated.dueAmount).toBe(0);
  }, 15000);
});
