import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool, createRole, createUser, createStudent,
  createActiveAcademicYear, createEnrollment, loginAs,
} from '../helpers/fixtures.js';
import { Role } from '../../src/models/Roles.model.js';
import { Student } from '../../src/models/student.model.js';
import { Circular } from '../../src/models/Circular.model.js';
import { CircularAcknowledgement } from '../../src/models/CircularAcknowledgement.model.js';

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
    name: `${roleName} ${seq}`, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@cir.test`,
    roleId: role._id, schoolId,
  });
  return { user, token: await loginAs(user.email) };
};

const scaffold = async () => {
  const school = await createSchool();
  const admin = await mkUser('School Admin', school._id);
  const year = await createActiveAcademicYear({ schoolId: school._id });
  return { school, admin, year, classId: new mongoose.Types.ObjectId(), sectionId: new mongoose.Types.ObjectId() };
};

/** A child in the scaffold's class, plus the parent linked to them. */
let rollSeq = 0;
const addFamily = async (ctx, { classId = ctx.classId, sectionId = ctx.sectionId } = {}) => {
  rollSeq += 1;
  const child = await mkUser('Student', ctx.school._id);
  const parent = await mkUser('Parent', ctx.school._id);
  const student = await createStudent({ userId: child.user._id, schoolId: ctx.school._id });
  await Student.updateOne({ _id: student._id }, { fatherId: parent.user._id });
  await createEnrollment({
    studentId: student._id, schoolId: ctx.school._id, academicYearId: ctx.year._id,
    schoolClassId: classId, sectionId, rollNumber: rollSeq,
  });
  return { child, parent, student };
};

const api = (token) => ({
  get: (p) => request(app).get(`/api/v1/circulars${p}`).set('Authorization', `Bearer ${token}`),
  post: (p, b) => request(app).post(`/api/v1/circulars${p}`).set('Authorization', `Bearer ${token}`).send(b),
  patch: (p, b) => request(app).patch(`/api/v1/circulars${p}`).set('Authorization', `Bearer ${token}`).send(b),
  del: (p) => request(app).delete(`/api/v1/circulars${p}`).set('Authorization', `Bearer ${token}`),
});

const draft = (ctx, body = {}) =>
  api(ctx.admin.token).post('', {
    title: 'Revised transport timings',
    body: 'Buses will leave 15 minutes earlier from Monday.',
    category: 'Safety',
    academicYearId: ctx.year._id,
    ...body,
  });

const publish = (ctx, id) => api(ctx.admin.token).post(`/${id}/publish`, {});

describe('issuing', () => {
  it('saves a new circular as a draft with no number yet', async () => {
    const ctx = await scaffold();

    const res = await draft(ctx);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    // The number is what people quote, so it is only assigned when it actually goes out.
    expect(res.body.data.circularNumber).toBe('');
  }, 30000);

  it('numbers it on publishing and snapshots who it went to', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const circular = (await draft(ctx)).body.data;

    const res = await publish(ctx, circular._id);

    expect(res.body.data.circularNumber).toMatch(/^CIR\/.+\/001$/);
    expect(res.body.data.recipientCount).toBeGreaterThan(0);
    expect(res.body.data.publishedAt).toEqual(expect.any(String));
  }, 30000);

  it('numbers circulars in sequence', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const first = (await draft(ctx)).body.data;
    const second = (await draft(ctx, { title: 'Second' })).body.data;

    await publish(ctx, first._id);
    const res = await publish(ctx, second._id);

    expect(res.body.data.circularNumber).toMatch(/\/002$/);
  }, 30000);

  it('refuses to publish to an audience that matches nobody', async () => {
    const ctx = await scaffold();
    const circular = (await draft(ctx, { audience: { roles: ['Hostel Warden'] } })).body.data;

    const res = await publish(ctx, circular._id);

    // Succeeding silently would leave the school believing a notice went out.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/matches nobody/);
  }, 30000);

  it('will not let a published circular be edited', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const circular = (await draft(ctx)).body.data;
    await publish(ctx, circular._id);

    const res = await api(ctx.admin.token).patch(`/${circular._id}`, { body: 'Actually, 30 minutes earlier.' });

    // People acknowledged a specific text; changing it leaves signatures against something nobody
    // agreed to.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/supersedes/);
  }, 30000);

  it('links a replacement to the circular it supersedes', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const first = (await draft(ctx)).body.data;
    await publish(ctx, first._id);

    const replacement = (await draft(ctx, { title: 'Corrected timings', supersedesId: first._id })).body.data;
    await publish(ctx, replacement._id);

    const old = await Circular.findById(first._id).lean();
    expect(String(old.supersededById)).toBe(String(replacement._id));
  }, 30000);

  it('archives rather than deletes once published', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const circular = (await draft(ctx)).body.data;
    await publish(ctx, circular._id);

    const del = await api(ctx.admin.token).del(`/${circular._id}`);
    const archive = await api(ctx.admin.token).post(`/${circular._id}/archive`, {});

    expect(del.status).toBe(400);
    expect(archive.body.data.status).toBe('archived');
    expect(await Circular.countDocuments({})).toBe(1);
  }, 30000);

  it('lets a draft be deleted', async () => {
    const ctx = await scaffold();
    const circular = (await draft(ctx)).body.data;

    const res = await api(ctx.admin.token).del(`/${circular._id}`);

    expect(res.status).toBe(200);
    expect(await Circular.countDocuments({})).toBe(0);
  }, 30000);
});

describe('who it reaches', () => {
  it('reaches the whole school when no audience is set', async () => {
    const ctx = await scaffold();
    const { child, parent } = await addFamily(ctx);
    const circular = (await draft(ctx)).body.data;

    await publish(ctx, circular._id);
    const forChild = await api(child.token).get('/mine');
    const forParent = await api(parent.token).get('/mine');

    expect(forChild.body.data).toHaveLength(1);
    expect(forParent.body.data).toHaveLength(1);
  }, 30000);

  it('reaches a class as the children and their parents', async () => {
    const ctx = await scaffold();
    const inClass = await addFamily(ctx);
    const elsewhere = await addFamily(ctx, { classId: new mongoose.Types.ObjectId() });
    const circular = (await draft(ctx, { audience: { schoolClassIds: [ctx.classId] } })).body.data;

    await publish(ctx, circular._id);

    // A circular addressed to "Class 10" almost always means the families, not just the children.
    expect((await api(inClass.child.token).get('/mine')).body.data).toHaveLength(1);
    expect((await api(inClass.parent.token).get('/mine')).body.data).toHaveLength(1);
    expect((await api(elsewhere.parent.token).get('/mine')).body.data).toHaveLength(0);
  }, 30000);

  it('narrows a class to one role when both are given', async () => {
    const ctx = await scaffold();
    const family = await addFamily(ctx);
    const circular = (await draft(ctx, {
      audience: { roles: ['Parent'], schoolClassIds: [ctx.classId] },
    })).body.data;

    await publish(ctx, circular._id);

    // "Parents of Class 10" cannot be said any other way.
    expect((await api(family.parent.token).get('/mine')).body.data).toHaveLength(1);
    expect((await api(family.child.token).get('/mine')).body.data).toHaveLength(0);
  }, 30000);

  it('does not move the recipient list when somebody joins later', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const circular = (await draft(ctx)).body.data;
    await publish(ctx, circular._id);
    const before = (await api(ctx.admin.token).get(`/${circular._id}/status`)).body.data.total;

    await addFamily(ctx);
    const after = (await api(ctx.admin.token).get(`/${circular._id}/status`)).body.data.total;

    // A child who joins in November must not appear as "has not acknowledged" an August circular.
    expect(after).toBe(before);
  }, 30000);

  it('does not show one school the circulars of another', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    await addFamily(theirs);
    const circular = (await draft(theirs)).body.data;
    await publish(theirs, circular._id);

    const res = await api(mine.admin.token).get('');

    expect(res.body.data).toHaveLength(0);
  }, 30000);
});

describe('reading and acknowledging', () => {
  const publishedFor = async (ctx, body = {}) => {
    const family = await addFamily(ctx);
    const circular = (await draft(ctx, body)).body.data;
    await publish(ctx, circular._id);
    return { family, circular };
  };

  it('records opening it, which is not the same as agreeing', async () => {
    const ctx = await scaffold();
    const { family, circular } = await publishedFor(ctx, { requiresAcknowledgement: true });

    await api(family.parent.token).get(`/${circular._id}`);
    const status = await api(ctx.admin.token).get(`/${circular._id}/status`);

    // A school reading "opened" as "agreed" has drawn the wrong conclusion from its own data.
    expect(status.body.data.viewed).toBe(1);
    expect(status.body.data.acknowledged).toBe(0);
  }, 30000);

  it('tells the reader their own state when they open it', async () => {
    const ctx = await scaffold();
    const { family, circular } = await publishedFor(ctx, { requiresAcknowledgement: true });

    const before = await api(family.parent.token).get(`/${circular._id}`);
    await api(family.parent.token).post(`/${circular._id}/acknowledge`, {});
    const after = await api(family.parent.token).get(`/${circular._id}`);

    // The page needs this to know whether to offer the button; a second request could disagree.
    expect(before.body.data.acknowledgedAt).toBeNull();
    expect(before.body.data.viewedAt).toEqual(expect.any(String));
    expect(after.body.data.acknowledgedAt).toEqual(expect.any(String));
  }, 30000);

  it('records an acknowledgement with the exact wording agreed to', async () => {
    const ctx = await scaffold();
    const { family, circular } = await publishedFor(ctx, {
      requiresAcknowledgement: true,
      acknowledgementText: 'I have read and understood the revised transport policy.',
    });

    await api(family.parent.token).post(`/${circular._id}/acknowledge`, {});

    const row = await CircularAcknowledgement.findOne({ userId: family.parent.user._id }).lean();
    // Copied onto the row, not pointed at — a record of agreement is only as good as the text
    // never changing.
    expect(row.acknowledgementText).toBe('I have read and understood the revised transport policy.');
    expect(row.acknowledgedAt).toEqual(expect.any(Date));
  }, 30000);

  it('is happy to be acknowledged twice without double counting', async () => {
    const ctx = await scaffold();
    const { family, circular } = await publishedFor(ctx, { requiresAcknowledgement: true });

    await api(family.parent.token).post(`/${circular._id}/acknowledge`, {});
    await api(family.parent.token).post(`/${circular._id}/acknowledge`, {});

    const status = await api(ctx.admin.token).get(`/${circular._id}/status`);
    expect(status.body.data.acknowledged).toBe(1);
  }, 30000);

  it('refuses an acknowledgement on a circular that does not ask for one', async () => {
    const ctx = await scaffold();
    const { family, circular } = await publishedFor(ctx, { requiresAcknowledgement: false });

    const res = await api(family.parent.token).post(`/${circular._id}/acknowledge`, {});

    expect(res.status).toBe(400);
  }, 30000);

  it('refuses somebody it was not addressed to', async () => {
    const ctx = await scaffold();
    const inClass = await addFamily(ctx);
    const outside = await addFamily(ctx, { classId: new mongoose.Types.ObjectId() });
    const circular = (await draft(ctx, {
      requiresAcknowledgement: true,
      audience: { schoolClassIds: [ctx.classId] },
    })).body.data;
    await publish(ctx, circular._id);
    void inClass;

    const res = await api(outside.parent.token).post(`/${circular._id}/acknowledge`, {});

    expect(res.status).toBe(403);
  }, 30000);

  it('tells a reader what still needs their acknowledgement', async () => {
    const ctx = await scaffold();
    const { family, circular } = await publishedFor(ctx, { requiresAcknowledgement: true });

    const before = await api(family.parent.token).get('/mine');
    await api(family.parent.token).post(`/${circular._id}/acknowledge`, {});
    const after = await api(family.parent.token).get('/mine');

    expect(before.body.data[0].needsAcknowledgement).toBe(true);
    expect(after.body.data[0].needsAcknowledgement).toBe(false);
  }, 30000);
});

describe('chasing it up', () => {
  it('lists who has not acknowledged yet', async () => {
    const ctx = await scaffold();
    const a = await addFamily(ctx);
    const b = await addFamily(ctx);
    const circular = (await draft(ctx, {
      requiresAcknowledgement: true,
      audience: { roles: ['Parent'] },
    })).body.data;
    await publish(ctx, circular._id);
    await api(a.parent.token).post(`/${circular._id}/acknowledge`, {});

    const res = await api(ctx.admin.token).get(`/${circular._id}/pending`);

    expect(res.body.data).toHaveLength(1);
    expect(String(res.body.data[0].userId)).toBe(String(b.parent.user._id));
  }, 30000);

  it('flags a circular that is past its deadline and still short', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const circular = (await draft(ctx, {
      requiresAcknowledgement: true,
      acknowledgementDeadline: '2020-01-01',
    })).body.data;
    await publish(ctx, circular._id);

    const res = await api(ctx.admin.token).get(`/${circular._id}/status`);

    expect(res.body.data.isOverdue).toBe(true);
    expect(res.body.data.percentAcknowledged).toBe(0);
  }, 30000);

  it('lists the acknowledgements themselves for the record', async () => {
    const ctx = await scaffold();
    const family = await addFamily(ctx);
    const circular = (await draft(ctx, { requiresAcknowledgement: true, audience: { roles: ['Parent'] } })).body.data;
    await publish(ctx, circular._id);
    await api(family.parent.token).post(`/${circular._id}/acknowledge`, { note: 'Noted' });

    const res = await api(ctx.admin.token).get(`/${circular._id}/acknowledgements`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId.name).toMatch(/Parent/);
    expect(res.body.data[0].note).toBe('Noted');
  }, 30000);
});

describe('who can do what', () => {
  it('lets reception draft but not publish', async () => {
    const ctx = await scaffold();
    await addFamily(ctx);
    const reception = await mkUser('Receptionist', ctx.school._id);
    const circular = (await api(reception.token).post('', {
      title: 'Notice', body: 'Text', academicYearId: ctx.year._id,
    })).body.data;

    const res = await api(reception.token).post(`/${circular._id}/publish`, {});

    // A circular carries the school's authority, and one sent in error can only be superseded.
    expect(res.status).toBe(403);
  }, 30000);

  it('keeps a parent out of the issuing list', async () => {
    const ctx = await scaffold();
    const family = await addFamily(ctx);

    const res = await api(family.parent.token).get('');

    expect(res.status).toBe(403);
  }, 30000);
});
