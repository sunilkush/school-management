import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool, createRole, createUser, createStudent,
  createActiveAcademicYear, createEnrollment, createStudentFee, loginAs,
} from '../helpers/fixtures.js';
import { Role } from '../../src/models/Roles.model.js';
import { StudentEnrollment } from '../../src/models/StudentEnrollment.model.js';
import { ScholarshipAward } from '../../src/models/ScholarshipAward.model.js';
import { StudentFee } from '../../src/models/studentFee.model.js';

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
    name: roleName, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@sch.test`,
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

const addStudent = async (ctx) => {
  seq += 1;
  const role = await roleFor('Student', ctx.school._id);
  const { user } = await createUser({
    name: `Pupil ${seq}`, email: `pupil-${seq}-${Date.now()}@sch.test`,
    roleId: role._id, schoolId: ctx.school._id,
  });
  const student = await createStudent({ userId: user._id, schoolId: ctx.school._id });
  const enrollment = await createEnrollment({
    studentId: student._id, schoolId: ctx.school._id, academicYearId: ctx.year._id,
  });
  return { student, enrollment };
};

const api = (token) => ({
  get: (p) => request(app).get(`/api/v1/scholarships${p}`).set('Authorization', `Bearer ${token}`),
  post: (p, b) => request(app).post(`/api/v1/scholarships${p}`).set('Authorization', `Bearer ${token}`).send(b),
  patch: (p, b) => request(app).patch(`/api/v1/scholarships${p}`).set('Authorization', `Bearer ${token}`).send(b),
  del: (p) => request(app).delete(`/api/v1/scholarships${p}`).set('Authorization', `Bearer ${token}`),
});

const makeScheme = (ctx, body = {}) =>
  api(ctx.admin.token).post('/schemes', {
    name: 'Staff Ward', code: 'STAFF', category: 'Staff Ward',
    discountType: 'percent', value: 50, academicYearId: ctx.year._id, ...body,
  });

const grant = (ctx, schemeId, studentId, body = {}) =>
  api(ctx.admin.token).post('/awards', { schemeId, studentId, academicYearId: ctx.year._id, ...body });

describe('schemes', () => {
  it('creates a named scheme with a code', async () => {
    const ctx = await scaffold();

    const res = await makeScheme(ctx);

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('STAFF');
  }, 30000);

  it('refuses two schemes with the same code', async () => {
    const ctx = await scaffold();
    await makeScheme(ctx);

    const res = await makeScheme(ctx, { name: 'Something else' });

    expect(res.status).toBe(409);
  }, 30000);

  it('refuses a percentage over 100', async () => {
    const ctx = await scaffold();

    const res = await makeScheme(ctx, { value: 150 });

    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 30000);

  it('will not delete a scheme that has been awarded', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx)).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, scheme._id, student._id);

    const res = await api(ctx.admin.token).del(`/schemes/${scheme._id}`);

    // Those awards are the record of money the school chose not to collect.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Deactivate it instead/);
  }, 30000);

  it('will not lower a cap below what has already been given', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { maxAwards: 5 })).body.data;
    const a = await addStudent(ctx);
    const b = await addStudent(ctx);
    await grant(ctx, scheme._id, a.student._id);
    await grant(ctx, scheme._id, b.student._id);

    const res = await api(ctx.admin.token).patch(`/schemes/${scheme._id}`, { maxAwards: 1 });

    expect(res.status).toBe(400);
  }, 30000);
});

describe('awarding', () => {
  it('holds an award for approval when the scheme asks for it', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { requiresApproval: true })).body.data;
    const { student } = await addStudent(ctx);

    const res = await grant(ctx, scheme._id, student._id, { reason: 'Father teaches here' });

    expect(res.body.data.status).toBe('pending');
  }, 30000);

  it('grants outright when the scheme needs no approval', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);

    const res = await grant(ctx, scheme._id, student._id);

    // Otherwise every sibling discount queues up waiting for a decision already made.
    expect(res.body.data.status).toBe('approved');
  }, 30000);

  it('refuses the same scheme twice for one student in a year', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx)).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, scheme._id, student._id);

    const res = await grant(ctx, scheme._id, student._id);

    expect(res.status).toBe(409);
  }, 30000);

  it('stops awarding past the number of funded places', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { maxAwards: 1 })).body.data;
    const a = await addStudent(ctx);
    const b = await addStudent(ctx);
    await grant(ctx, scheme._id, a.student._id);

    const res = await grant(ctx, scheme._id, b.student._id);

    // Awarding the twenty-first of twenty funded places is the mistake nobody notices until the
    // accounts are closed.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/place\(s\) on this scheme/);
  }, 30000);

  it('counts a pending request against the cap', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { maxAwards: 1, requiresApproval: true })).body.data;
    const a = await addStudent(ctx);
    const b = await addStudent(ctx);
    await grant(ctx, scheme._id, a.student._id);

    const res = await grant(ctx, scheme._id, b.student._id);

    // A place promised is a place gone.
    expect(res.status).toBe(400);
  }, 30000);

  it('frees the place again when a request is rejected', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { maxAwards: 1 })).body.data;
    const a = await addStudent(ctx);
    const b = await addStudent(ctx);
    const award = (await grant(ctx, scheme._id, a.student._id)).body.data;
    await api(ctx.admin.token).patch(`/awards/${award._id}/decide`, { decision: 'rejected', note: 'Not eligible' });

    const res = await grant(ctx, scheme._id, b.student._id);

    expect(res.status).toBe(201);
  }, 30000);

  it('records who approved it and when', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx)).body.data;
    const { student } = await addStudent(ctx);
    const award = (await grant(ctx, scheme._id, student._id)).body.data;

    const res = await api(ctx.admin.token).patch(`/awards/${award._id}/decide`, { decision: 'approved', note: 'Verified' });

    expect(res.body.data.status).toBe('approved');
    expect(String(res.body.data.approvedBy)).toBe(String(ctx.admin.user._id));
    expect(res.body.data.approvedAt).toEqual(expect.any(String));
  }, 30000);

  it('will not decide the same award twice', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx)).body.data;
    const { student } = await addStudent(ctx);
    const award = (await grant(ctx, scheme._id, student._id)).body.data;
    await api(ctx.admin.token).patch(`/awards/${award._id}/decide`, { decision: 'approved' });

    const res = await api(ctx.admin.token).patch(`/awards/${award._id}/decide`, { decision: 'rejected' });

    expect(res.status).toBe(400);
  }, 30000);

  it('insists on a reason before taking a concession away', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    const award = (await grant(ctx, scheme._id, student._id)).body.data;

    const noReason = await api(ctx.admin.token).patch(`/awards/${award._id}/revoke`, {});
    const withReason = await api(ctx.admin.token).patch(`/awards/${award._id}/revoke`, { note: 'Parent left the school' });

    // A concession taken away from a family needs a reason on the record more than one granted.
    expect(noReason.status).toBe(400);
    expect(withReason.body.data.status).toBe('revoked');
  }, 30000);

  it('cannot award a student from another school', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    const scheme = (await makeScheme(mine)).body.data;
    const { student } = await addStudent(theirs);

    const res = await grant(mine, scheme._id, student._id);

    expect(res.status).toBe(404);
  }, 30000);
});

describe('the combined concession', () => {
  it('adds percentages rather than compounding them', async () => {
    const ctx = await scaffold();
    const staff = (await makeScheme(ctx, { code: 'STAFF', value: 30, requiresApproval: false })).body.data;
    const sibling = (await makeScheme(ctx, { name: 'Sibling', code: 'SIB', category: 'Sibling', value: 20, requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, staff._id, student._id);
    await grant(ctx, sibling._id, student._id);

    const res = await api(ctx.admin.token).get(`/students/${student._id}`);

    // 30 + 20 = 50, not 44. It is what the school told the parent.
    expect(res.body.data.percent).toBe(50);
    expect(res.body.data.awards).toHaveLength(2);
  }, 30000);

  it('caps the total at 100 and says that it did', async () => {
    const ctx = await scaffold();
    const a = (await makeScheme(ctx, { code: 'A', value: 60, requiresApproval: false })).body.data;
    const b = (await makeScheme(ctx, { name: 'Second', code: 'B', value: 60, requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, a._id, student._id);
    await grant(ctx, b._id, student._id);

    const res = await api(ctx.admin.token).get(`/students/${student._id}`);

    // A school refunding money it never charged is not a rounding error.
    expect(res.body.data.percent).toBe(100);
    expect(res.body.data.percentBeforeCap).toBe(120);
    expect(res.body.data.wasCapped).toBe(true);
  }, 30000);

  it('ignores a concession that is still pending', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { requiresApproval: true })).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, scheme._id, student._id);

    const res = await api(ctx.admin.token).get(`/students/${student._id}`);

    expect(res.body.data.percent).toBe(0);
  }, 30000);

  it('ignores one that has been revoked', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    const award = (await grant(ctx, scheme._id, student._id)).body.data;
    await api(ctx.admin.token).patch(`/awards/${award._id}/revoke`, { note: 'Left' });

    const res = await api(ctx.admin.token).get(`/students/${student._id}`);

    expect(res.body.data.percent).toBe(0);
  }, 30000);

  it('ignores one whose dates have passed', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, scheme._id, student._id, {
      validFrom: '2020-01-01', validUntil: '2020-12-31',
    });

    const res = await api(ctx.admin.token).get(`/students/${student._id}`);

    expect(res.body.data.percent).toBe(0);
  }, 30000);
});

describe('applying it to fees', () => {
  it('writes the concession onto the enrolment the fee code already reads', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { value: 40, requiresApproval: false })).body.data;
    const { student, enrollment } = await addStudent(ctx);
    await grant(ctx, scheme._id, student._id);

    const res = await api(ctx.admin.token).post('/sync', { academicYearId: ctx.year._id });

    expect(res.body.data.updated).toBe(1);
    const after = await StudentEnrollment.findById(enrollment._id).lean();
    expect(after.feeDiscount).toBe(40);
  }, 30000);

  it('changes nothing on a second run', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { value: 40, requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, scheme._id, student._id);
    await api(ctx.admin.token).post('/sync', { academicYearId: ctx.year._id });

    const again = await api(ctx.admin.token).post('/sync', { academicYearId: ctx.year._id });

    expect(again.body.data.updated).toBe(0);
  }, 30000);

  it('flags a bill that no longer matches instead of rewriting it', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { value: 40, requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    await createStudentFee({
      schoolId: ctx.school._id, studentId: student._id, academicYearId: ctx.year._id, totalAmount: 10000,
    });
    await grant(ctx, scheme._id, student._id);

    const res = await api(ctx.admin.token).get(`/mismatches?academicYearId=${ctx.year._id}`);

    // Changing a bill a parent has already seen is a decision, not a cleanup task.
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].onBill).toBe(0);
    expect(res.body.data[0].nowEntitledTo).toBe(40);
  }, 30000);
});

describe('the giveaway report', () => {
  it('adds up what is being given away, by scheme and category', async () => {
    const ctx = await scaffold();
    const staff = (await makeScheme(ctx, { code: 'STAFF', value: 50, requiresApproval: false })).body.data;
    const merit = (await makeScheme(ctx, { name: 'Merit', code: 'MERIT', category: 'Merit', value: 25, requiresApproval: true })).body.data;
    const a = await addStudent(ctx);
    const b = await addStudent(ctx);
    await grant(ctx, staff._id, a.student._id);
    await grant(ctx, merit._id, b.student._id);

    const res = await api(ctx.admin.token).get('/report');

    expect(res.body.data.totalApproved).toBe(1);
    expect(res.body.data.totalPending).toBe(1);
    // Says plainly that the rupee figures only follow a recalculation.
    expect(res.body.data.note).toMatch(/last time concessions were applied/);
  }, 30000);

  it('costs each award once the fees carry a discount', async () => {
    const ctx = await scaffold();
    const scheme = (await makeScheme(ctx, { value: 40, requiresApproval: false })).body.data;
    const { student } = await addStudent(ctx);
    await grant(ctx, scheme._id, student._id);
    const fee = await createStudentFee({
      schoolId: ctx.school._id, studentId: student._id, academicYearId: ctx.year._id, totalAmount: 6000,
    });
    // createStudentFee does not forward extra fields, and discountApplied is what
    // assignFeesToStudents writes in the real flow — set it directly so the premise holds.
    await StudentFee.updateOne({ _id: fee._id }, { $set: { discountApplied: { percent: 40, amount: 4000 } } });

    await api(ctx.admin.token).post('/record-amounts', { academicYearId: ctx.year._id });
    const res = await api(ctx.admin.token).get('/report');

    expect(res.body.data.totalWaived).toBe(4000);
    const award = await ScholarshipAward.findOne({ studentId: student._id }).lean();
    expect(award.appliedAmount).toBe(4000);
    expect(award.appliedAt).toEqual(expect.any(Date));
  }, 30000);
});

describe('who can do what', () => {
  it('lets an accountant set schemes up but not approve them', async () => {
    const ctx = await scaffold();
    const accountant = await mkUser('Accountant', ctx.school._id);
    const scheme = (await makeScheme(ctx)).body.data;
    const { student } = await addStudent(ctx);
    const award = (await grant(ctx, scheme._id, student._id)).body.data;

    const canCreate = await api(accountant.token).post('/schemes', {
      name: 'Sports', code: 'SPORT', category: 'Sports', value: 15, academicYearId: ctx.year._id,
    });
    const cannotApprove = await api(accountant.token).patch(`/awards/${award._id}/decide`, { decision: 'approved' });

    // A concession is a permanent hole in the year's income, so approving it stays with the
    // people who carry the budget.
    expect(canCreate.status).toBe(201);
    expect(cannotApprove.status).toBe(403);
  }, 30000);

  it('keeps a teacher out entirely', async () => {
    const ctx = await scaffold();
    const teacher = await mkUser('Teacher', ctx.school._id);

    const res = await api(teacher.token).get('/schemes');

    expect(res.status).toBe(403);
  }, 30000);
});
