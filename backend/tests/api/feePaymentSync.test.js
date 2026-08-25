import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createStudent, createStudentFee, loginAs } from '../helpers/fixtures.js';
import { StudentFee } from '../../src/models/studentFee.model.js';
import { FeeInstallment } from '../../src/models/feeInstallment.model.js';
import { FeeStructure } from '../../src/models/feeStructure.model.js';
import { StudentEnrollment } from '../../src/models/StudentEnrollment.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('POST /payments — keeps StudentFee in sync with the installment it pays (the sync bug fix)', () => {
  it('updates both FeeInstallment.paidAmount and its parent StudentFee.paidAmount/dueAmount/status in one call', async () => {
    const school = await createSchool();
    const accountantRole = await createRole('Accountant');
    const studentRole = await createRole('Student');

    const { user: accountant } = await createUser({ name: 'Accountant', email: 'accountant@school.test', roleId: accountantRole._id, schoolId: school._id });
    const { user: studentUser } = await createUser({ name: 'Student', email: 'student@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id });

    const studentFee = await createStudentFee({ schoolId: school._id, studentId: student._id, totalAmount: 1000 });
    const installment = await FeeInstallment.create({
      schoolId: school._id,
      academicYearId: studentFee.academicYearId,
      studentId: student._id,
      studentFeeId: studentFee._id,
      installmentName: 'Q1',
      amount: 1000,
      paidAmount: 0,
      dueDate: new Date(),
      status: 'pending',
    });

    const token = await loginAs(accountant.email);

    const response = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ installmentId: installment._id.toString(), amount: 1000, paymentMode: 'cash' });

    expect(response.status).toBe(201);

    const updatedInstallment = await FeeInstallment.findById(installment._id);
    expect(updatedInstallment.paidAmount).toBe(1000);
    expect(updatedInstallment.status).toBe('paid');

    // Before the fix, createPayment only touched FeeInstallment — StudentFee stayed at
    // paidAmount: 0 / status: "pending" forever after a real payment went through here.
    const updatedStudentFee = await StudentFee.findById(studentFee._id);
    expect(updatedStudentFee.paidAmount).toBe(1000);
    expect(updatedStudentFee.dueAmount).toBe(0);
    expect(updatedStudentFee.status).toBe('paid');
  }, 15000);

  it('a partial installment payment leaves StudentFee correctly partial, not paid', async () => {
    const school = await createSchool();
    const accountantRole = await createRole('Accountant');
    const studentRole = await createRole('Student');

    const { user: accountant } = await createUser({ name: 'Accountant', email: 'accountant2@school.test', roleId: accountantRole._id, schoolId: school._id });
    const { user: studentUser } = await createUser({ name: 'Student', email: 'student2@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id });

    const studentFee = await createStudentFee({ schoolId: school._id, studentId: student._id, totalAmount: 1000 });
    const installment = await FeeInstallment.create({
      schoolId: school._id,
      academicYearId: studentFee.academicYearId,
      studentId: student._id,
      studentFeeId: studentFee._id,
      installmentName: 'Q1',
      amount: 1000,
      paidAmount: 0,
      dueDate: new Date(),
      status: 'pending',
    });

    const token = await loginAs(accountant.email);

    const response = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ installmentId: installment._id.toString(), amount: 400, paymentMode: 'cash' });

    expect(response.status).toBe(201);

    const updatedStudentFee = await StudentFee.findById(studentFee._id);
    expect(updatedStudentFee.paidAmount).toBe(400);
    expect(updatedStudentFee.dueAmount).toBe(600);
    expect(updatedStudentFee.status).toBe('partial');
  }, 15000);
});

describe('POST /student-fees/assign — discount auto-apply', () => {
  it("applies the student's StudentEnrollment.feeDiscount percentage when no customAmount is given", async () => {
    const school = await createSchool();
    const adminRole = await createRole('School Admin', { schoolId: school._id });
    const studentRole = await createRole('Student', { schoolId: school._id });

    const { user: admin } = await createUser({ name: 'Admin', email: 'admin@school.test', roleId: adminRole._id, schoolId: school._id });
    const { user: studentUser } = await createUser({ name: 'Discounted Student', email: 'discounted@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id });

    const academicYearId = new mongoose.Types.ObjectId();
    await StudentEnrollment.create({
      studentId: student._id,
      schoolId: school._id,
      academicYearId,
      registrationNumber: 'REG-DISC-1',
      schoolClassId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      feeDiscount: 10,
    });

    const feeStructure = await FeeStructure.create({
      schoolId: school._id,
      schoolClassId: new mongoose.Types.ObjectId(),
      academicYearId,
      feeHeadId: new mongoose.Types.ObjectId(),
      amount: 1000,
      frequency: 'yearly',
    });

    const token = await loginAs(admin.email);

    const response = await request(app)
      .post('/api/v1/student-fees/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ feeStructureId: feeStructure._id.toString(), studentId: student._id.toString(), academicYearId: academicYearId.toString() });

    expect(response.status).toBe(201);
    expect(response.body.data.discounted).toHaveLength(1);

    const created = await StudentFee.findOne({ studentId: student._id, feeStructureId: feeStructure._id });
    expect(created.totalAmount).toBe(900);
    expect(created.dueAmount).toBe(900);
    expect(created.discountApplied.percent).toBe(10);
    expect(created.discountApplied.amount).toBe(100);
  }, 15000);

  it('an explicit customAmount overrides the discount entirely', async () => {
    const school = await createSchool();
    const adminRole = await createRole('School Admin', { schoolId: school._id });
    const studentRole = await createRole('Student', { schoolId: school._id });

    const { user: admin } = await createUser({ name: 'Admin', email: 'admin2@school.test', roleId: adminRole._id, schoolId: school._id });
    const { user: studentUser } = await createUser({ name: 'Discounted Student 2', email: 'discounted2@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id });

    const academicYearId = new mongoose.Types.ObjectId();
    await StudentEnrollment.create({
      studentId: student._id,
      schoolId: school._id,
      academicYearId,
      registrationNumber: 'REG-DISC-2',
      schoolClassId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      feeDiscount: 50,
    });

    const feeStructure = await FeeStructure.create({
      schoolId: school._id,
      schoolClassId: new mongoose.Types.ObjectId(),
      academicYearId,
      feeHeadId: new mongoose.Types.ObjectId(),
      amount: 1000,
      frequency: 'yearly',
    });

    const token = await loginAs(admin.email);

    const response = await request(app)
      .post('/api/v1/student-fees/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        feeStructureId: feeStructure._id.toString(),
        studentId: student._id.toString(),
        academicYearId: academicYearId.toString(),
        customAmount: 700,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.discounted).toHaveLength(0);

    const created = await StudentFee.findOne({ studentId: student._id, feeStructureId: feeStructure._id });
    expect(created.totalAmount).toBe(700);
    expect(created.discountApplied).toBeFalsy();
  }, 15000);
});
