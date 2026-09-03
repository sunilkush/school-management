import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool, createRole, createUser, createStudent,
  createActiveAcademicYear, createEnrollment, loginAs,
} from '../helpers/fixtures.js';
import { Role } from '../../src/models/Roles.model.js';
import { Student } from '../../src/models/student.model.js';
import mongoose from 'mongoose';
import { SchoolClass } from '../../src/models/schoolClass.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

let seq = 0;

const roleFor = async (name, schoolId) =>
  (await Role.findOne({ name, schoolId })) || createRole(name, { schoolId });

const mkUser = async (roleName, schoolId) => {
  seq += 1;
  const role = await roleFor(roleName, schoolId);
  const { user } = await createUser({
    name: roleName, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@udise.test`,
    roleId: role._id, schoolId,
  });
  return { user, token: await loginAs(user.email) };
};

const scaffold = async () => {
  const school = await createSchool();
  const admin = await mkUser('School Admin', school._id);
  const year = await createActiveAcademicYear({ schoolId: school._id });
  return { school, admin, year };
};

/** A student enrolled in a named class, so the RTE report has something to group by. */
const addStudent = async (ctx, { className = 'Class I', compliance = {} } = {}) => {
  seq += 1;
  const child = await mkUser('Student', ctx.school._id);
  const student = await createStudent({
    userId: child.user._id, schoolId: ctx.school._id,
    dateOfBirth: new Date('2018-04-01'), gender: 'Male',
    compliance,
  });

  let schoolClass = await SchoolClass.findOne({ schoolId: ctx.school._id, name: className });
  if (!schoolClass) {
    schoolClass = await SchoolClass.create({
      schoolId: ctx.school._id, academicYearId: ctx.year._id, name: className,
      boardClassId: new mongoose.Types.ObjectId(),
    });
  }

  await createEnrollment({
    studentId: student._id, schoolId: ctx.school._id, academicYearId: ctx.year._id,
    schoolClassId: schoolClass._id,
  });

  return student;
};

const api = (ctx) => ({
  get: (path) => request(app).get(`/api/v1/compliance${path}`).set('Authorization', `Bearer ${ctx.admin.token}`),
  put: (path, body) => request(app).put(`/api/v1/compliance${path}`).set('Authorization', `Bearer ${ctx.admin.token}`).send(body),
  patch: (path, body) => request(app).patch(`/api/v1/compliance${path}`).set('Authorization', `Bearer ${ctx.admin.token}`).send(body),
});

describe('school identifiers', () => {
  it('saves a valid UDISE code', async () => {
    const ctx = await scaffold();

    const res = await api(ctx).put('/school', { udiseCode: '08123456789', affiliationBoard: 'CBSE' });

    expect(res.status).toBe(200);
    expect(res.body.data.udiseCode).toBe('08123456789');
  }, 25000);

  it('refuses a UDISE code that is the wrong length', async () => {
    const ctx = await scaffold();

    const res = await api(ctx).put('/school', { udiseCode: '123' });

    // Caught now, rather than as a rejected row at filing time months later.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/11 digits/);
  }, 25000);

  it('refuses a UDISE code containing letters', async () => {
    const ctx = await scaffold();

    const res = await api(ctx).put('/school', { udiseCode: '0812345678X' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/digits only/);
  }, 25000);

  it('refuses an RTE quota outside 0-100', async () => {
    const ctx = await scaffold();

    const res = await api(ctx).put('/school', { rteQuotaPercent: 250 });

    expect(res.status).toBe(400);
  }, 25000);
});

describe('student identifiers', () => {
  it('saves a PEN of the right shape', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);

    const res = await api(ctx).patch(`/students/${student._id}`, { pen: '12345678901' });

    expect(res.status).toBe(200);
    expect(res.body.data.pen).toBe('12345678901');
  }, 25000);

  it('refuses a PEN of the wrong length', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);

    const res = await api(ctx).patch(`/students/${student._id}`, { pen: '123' });

    expect(res.status).toBe(400);
  }, 25000);

  it('refuses to give one PEN to two children', async () => {
    const ctx = await scaffold();
    const first = await addStudent(ctx);
    const second = await addStudent(ctx);
    await api(ctx).patch(`/students/${first._id}`, { pen: '12345678901' });

    const res = await api(ctx).patch(`/students/${second._id}`, { pen: '12345678901' });

    expect(res.status).toBe(409);
  }, 25000);

  it('will not accept an APAAR ID without the parent consent behind it', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);

    const res = await api(ctx).patch(`/students/${student._id}`, { apaarId: '123456789012' });

    // An APAAR id cannot be created without consent, so one recorded without it is a problem.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/consent/i);
  }, 25000);

  it('accepts an APAAR ID once consent is recorded', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);

    const res = await api(ctx).patch(`/students/${student._id}`, {
      apaarConsent: true, apaarId: '123456789012',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.apaarConsent.given).toBe(true);
    expect(res.body.data.apaarConsent.givenAt).toEqual(expect.any(String));
  }, 25000);

  it('stores only the last four Aadhaar digits', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);

    const ok = await api(ctx).patch(`/students/${student._id}`, { aadhaarLast4: '4321', aadhaarOnFile: true });
    const full = await api(ctx).patch(`/students/${student._id}`, { aadhaarLast4: '123412341234' });

    expect(ok.status).toBe(200);
    // Deliberately not a place to keep whole Aadhaar numbers.
    expect(full.status).toBe(400);
    const saved = await Student.findById(student._id).lean();
    expect(saved.compliance.aadhaarLast4).toBe('4321');
  }, 25000);

  it('will not touch a student from another school', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    const student = await addStudent(theirs);

    const res = await api(mine).patch(`/students/${student._id}`, { pen: '12345678901' });

    expect(res.status).toBe(404);
  }, 25000);
});

describe('readiness', () => {
  it('counts how many children are missing each field', async () => {
    const ctx = await scaffold();
    await addStudent(ctx);
    await addStudent(ctx);

    const res = await api(ctx).get('/readiness');

    expect(res.body.data.totalStudents).toBe(2);
    expect(res.body.data.incompleteStudents).toBe(2);
    // Grouped by field, because "2 children have no mother tongue" is a job somebody can do.
    const fields = res.body.data.missingByField.map((f) => f.key);
    expect(fields).toEqual(expect.arrayContaining(['socialCategory', 'motherTongue', 'pen']));
  }, 25000);

  it('counts a fully filled record as ready', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    await api(ctx).patch(`/students/${student._id}`, {
      socialCategory: 'OBC', motherTongue: 'Hindi', aadhaarOnFile: true,
      aadhaarLast4: '4321', pen: '12345678901',
    });

    const res = await api(ctx).get('/readiness');

    expect(res.body.data.readyStudents).toBe(1);
    expect(res.body.data.incompleteStudents).toBe(0);
  }, 25000);

  it('reports APAAR separately from the fillable fields', async () => {
    const ctx = await scaffold();
    await addStudent(ctx);

    const res = await api(ctx).get('/readiness');

    // APAAR needs a parent's consent, not data entry — mixing it in would make a completable
    // list look permanently unfinishable.
    expect(res.body.data.missingByField.map((f) => f.key)).not.toContain('apaarId');
    expect(res.body.data.apaar.no_consent).toBe(1);
  }, 25000);

  it('says outright when the school itself has no UDISE code', async () => {
    const ctx = await scaffold();

    const before = await api(ctx).get('/readiness');
    await api(ctx).put('/school', { udiseCode: '08123456789' });
    const after = await api(ctx).get('/readiness');

    expect(before.body.data.schoolIdentifiersComplete).toBe(false);
    expect(after.body.data.schoolIdentifiersComplete).toBe(true);
  }, 25000);

  it('does not count another school students', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    await addStudent(theirs);

    const res = await api(mine).get('/readiness');

    expect(res.body.data.totalStudents).toBe(0);
  }, 25000);
});

describe('RTE position', () => {
  it('reports the quota per class, not just school-wide', async () => {
    const ctx = await scaffold();
    await addStudent(ctx, { className: 'Class I', compliance: { rteAdmission: true, rteCategory: 'EWS' } });
    await addStudent(ctx, { className: 'Class I' });
    await addStudent(ctx, { className: 'Class I' });
    await addStudent(ctx, { className: 'Class II' });

    const res = await api(ctx).get('/rte');

    const classI = res.body.data.classes.find((c) => c.className === 'Class I');
    const classII = res.body.data.classes.find((c) => c.className === 'Class II');
    expect(classI.total).toBe(3);
    expect(classI.rte).toBe(1);
    // 25% of 3 rounds up to 1 seat, which this class has filled.
    expect(classI.quotaSeats).toBe(1);
    expect(classI.meetsQuota).toBe(true);
    // A school can look fine overall while a class has admitted nobody.
    expect(classII.meetsQuota).toBe(false);
  }, 25000);

  it('uses the school configured quota rather than assuming 25%', async () => {
    const ctx = await scaffold();
    await api(ctx).put('/school', { rteQuotaPercent: 0 });
    await addStudent(ctx, { className: 'Class I' });

    const res = await api(ctx).get('/rte');

    // A government school is not held to the private-school figure; a hard-coded 25 would report
    // it as non-compliant forever.
    expect(res.body.data.quotaPercent).toBe(0);
    expect(res.body.data.classes[0].meetsQuota).toBe(true);
  }, 25000);
});

describe('bulk update', () => {
  it('updates many students at once', async () => {
    const ctx = await scaffold();
    const a = await addStudent(ctx);
    const b = await addStudent(ctx);

    const res = await api(ctx).patch('/students/bulk', {
      rows: [
        { studentId: a._id, pen: '11111111111', motherTongue: 'Hindi' },
        { studentId: b._id, pen: '22222222222', motherTongue: 'Marathi' },
      ],
    });

    expect(res.body.data.updated).toBe(2);
    expect(res.body.data.failed).toHaveLength(0);
  }, 25000);

  it('saves the good rows and reports the bad ones individually', async () => {
    const ctx = await scaffold();
    const a = await addStudent(ctx);
    const b = await addStudent(ctx);
    await api(ctx).patch(`/students/${a._id}`, { pen: '11111111111' });

    const res = await api(ctx).patch('/students/bulk', {
      rows: [
        { studentId: b._id, pen: '11111111111' },
        { studentId: b._id, motherTongue: 'Tamil' },
      ],
    });

    // Failing the whole batch over one duplicate would stop the office making any progress.
    expect(res.body.data.updated).toBe(1);
    expect(res.body.data.failed).toHaveLength(1);
    expect(res.body.data.failed[0].reason).toMatch(/already belongs/);
  }, 25000);

  it('refuses a bulk row pointing at another school student', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    const outsider = await addStudent(theirs);

    const res = await api(mine).patch('/students/bulk', {
      rows: [{ studentId: outsider._id, pen: '33333333333' }],
    });

    expect(res.body.data.updated).toBe(0);
    expect(res.body.data.failed[0].reason).toMatch(/not found/);
  }, 25000);
});

describe('export', () => {
  it('includes the blanks so they get filled in', async () => {
    const ctx = await scaffold();
    await addStudent(ctx, { className: 'Class I' });

    const res = await api(ctx).get('/export');

    const row = res.body.data[0];
    expect(row.className).toBe('Class I');
    // A blank that is visible in the sheet gets filled; one quietly omitted does not.
    expect(row).toHaveProperty('pen', '');
    expect(row).toHaveProperty('socialCategory', '');
    expect(row.apaarConsent).toBe('No');
  }, 25000);
});

describe('who can change what', () => {
  it('lets leadership read the position but not change a child record', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const principal = await mkUser('Principal', ctx.school._id);

    const read = await request(app).get('/api/v1/compliance/rte')
      .set('Authorization', `Bearer ${principal.token}`);
    const write = await request(app).patch(`/api/v1/compliance/students/${student._id}`)
      .set('Authorization', `Bearer ${principal.token}`).send({ rteAdmission: true });

    expect(read.status).toBe(200);
    expect(write.status).toBe(403);
  }, 25000);

  it('keeps a teacher out entirely', async () => {
    const ctx = await scaffold();
    const teacher = await mkUser('Teacher', ctx.school._id);

    const res = await request(app).get('/api/v1/compliance/students')
      .set('Authorization', `Bearer ${teacher.token}`);

    expect(res.status).toBe(403);
  }, 25000);
});
