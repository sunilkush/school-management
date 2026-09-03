import crypto from 'crypto';
import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';
import { Role } from '../../src/models/Roles.model.js';
import { School } from '../../src/models/school.model.js';
import { Attendance } from '../../src/models/attendance.model.js';
import { AttendanceCredential } from '../../src/models/AttendanceCredential.model.js';
import { DevicePunch } from '../../src/models/DevicePunch.model.js';

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
    name: roleName, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@dev.test`,
    roleId: role._id, schoolId,
  });
  return { user, token: await loginAs(user.email) };
};

/** A school with an admin, a registered reader, and one teacher whose card is enrolled. */
const scaffold = async ({ enrol = true } = {}) => {
  const school = await createSchool();
  const admin = await mkUser('School Admin', school._id);
  const teacher = await mkUser('Teacher', school._id);

  const res = await request(app)
    .post('/api/v1/attendance-devices')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ name: 'Staff Room Terminal', location: 'Staff Room', deviceType: 'biometric' });

  const { deviceKey, secret, device } = res.body.data;

  if (enrol) {
    await request(app)
      .post('/api/v1/attendance-devices/credentials')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ userId: teacher.user._id, externalId: 'CARD-001', credentialType: 'rfid', role: 'teacher' });
  }

  return { school, admin, teacher, deviceKey, secret, device };
};

/** Posts a signed batch exactly the way a reader would. */
const punch = (ctx, punches, { secret = ctx.secret, key = ctx.deviceKey } = {}) => {
  const body = JSON.stringify({ punches });
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return request(app)
    .post('/api/v1/attendance-devices/punches')
    .set('x-device-key', key)
    .set('x-device-signature', signature)
    .set('Content-Type', 'application/json')
    .send(body);
};

/** A time today at a given IST wall-clock hour, expressed as a real instant. */
const istToday = (hh, mm = 0) => {
  const now = new Date();
  // IST is UTC+5:30, so an IST wall clock of 08:00 is 02:30 UTC on the same day.
  const utcMinutes = hh * 60 + mm - (5 * 60 + 30);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  return new Date(d.getTime() + utcMinutes * 60000);
};

describe('device authentication', () => {
  it('accepts a batch signed with the device secret', async () => {
    const ctx = await scaffold();

    const res = await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 5).toISOString() }]);

    expect(res.status).toBe(200);
    expect(res.body.data.accepted).toBe(1);
  }, 25000);

  it('refuses a batch signed with the wrong secret', async () => {
    const ctx = await scaffold();

    const res = await punch(ctx, [{ externalId: 'CARD-001' }], { secret: 'not-the-secret' });

    expect(res.status).toBe(401);
    expect(await DevicePunch.countDocuments({})).toBe(0);
  }, 25000);

  it('gives the same answer for an unknown device as for a bad signature', async () => {
    const ctx = await scaffold();

    const res = await punch(ctx, [{ externalId: 'CARD-001' }], { key: 'dev_doesnotexist' });

    // A different response would let anyone probe which device keys are real.
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/authentication failed/i);
  }, 25000);

  it('refuses an unsigned request outright', async () => {
    await scaffold();

    const res = await request(app)
      .post('/api/v1/attendance-devices/punches')
      .send({ punches: [{ externalId: 'CARD-001' }] });

    expect(res.status).toBe(401);
  }, 25000);

  it('stops accepting punches once the device is deactivated', async () => {
    const ctx = await scaffold();
    await request(app)
      .put(`/api/v1/attendance-devices/${ctx.device._id}`)
      .set('Authorization', `Bearer ${ctx.admin.token}`)
      .send({ isActive: false });

    const res = await punch(ctx, [{ externalId: 'CARD-001' }]);

    expect(res.status).toBe(403);
  }, 25000);

  it('invalidates the old secret when it is rotated', async () => {
    const ctx = await scaffold();
    const rotated = await request(app)
      .post(`/api/v1/attendance-devices/${ctx.device._id}/rotate-secret`)
      .set('Authorization', `Bearer ${ctx.admin.token}`)
      .send({});

    const withOld = await punch(ctx, [{ externalId: 'CARD-001' }]);
    const withNew = await punch(ctx, [{ externalId: 'CARD-001' }], { secret: rotated.body.data.secret });

    expect(withOld.status).toBe(401);
    expect(withNew.status).toBe(200);
  }, 25000);
});

describe('ingesting punches', () => {
  it('ignores a batch the device already delivered', async () => {
    const ctx = await scaffold();
    const at = istToday(8, 5).toISOString();

    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: at }]);
    const again = await punch(ctx, [{ externalId: 'CARD-001', punchedAt: at }]);

    // A reader that loses its connection mid-upload resends the whole batch.
    expect(again.body.data.accepted).toBe(0);
    expect(again.body.data.duplicates).toBe(1);
    expect(await DevicePunch.countDocuments({})).toBe(1);
  }, 25000);

  it('rejects a punch dated in the future rather than marking a day that has not happened', async () => {
    const ctx = await scaffold();
    const tomorrow = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

    const res = await punch(ctx, [{ externalId: 'CARD-001', punchedAt: tomorrow }]);

    expect(res.body.data.accepted).toBe(0);
    expect(res.body.data.rejected[0].reason).toMatch(/device clock/);
  }, 25000);

  it('keeps the good punches when one in the batch is unusable', async () => {
    const ctx = await scaffold();

    const res = await punch(ctx, [
      { externalId: 'CARD-001', punchedAt: istToday(8, 5).toISOString() },
      { externalId: '', punchedAt: istToday(8, 6).toISOString() },
    ]);

    expect(res.body.data.accepted).toBe(1);
    expect(res.body.data.rejected).toHaveLength(1);
  }, 25000);
});

describe('turning punches into attendance', () => {
  it('marks the first punch of the day as the arrival', async () => {
    const ctx = await scaffold();

    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 5).toISOString() }]);

    const record = await Attendance.findOne({ userId: ctx.teacher.user._id });
    expect(record.status).toBe('present');
    expect(record.source).toBe('device');
    expect(record.checkInAt).toEqual(istToday(8, 5));
    // One punch is an arrival and nothing else — inventing a departure from it would fabricate
    // a time nobody recorded.
    expect(record.checkOutAt).toBeNull();
  }, 25000);

  it('uses the earliest and latest punch as arrival and departure', async () => {
    const ctx = await scaffold();

    await punch(ctx, [
      { externalId: 'CARD-001', punchedAt: istToday(15, 30).toISOString() },
      { externalId: 'CARD-001', punchedAt: istToday(8, 2).toISOString() },
      { externalId: 'CARD-001', punchedAt: istToday(12, 0).toISOString() },
    ]);

    const record = await Attendance.findOne({ userId: ctx.teacher.user._id });
    expect(record.checkInAt).toEqual(istToday(8, 2));
    expect(record.checkOutAt).toEqual(istToday(15, 30));
  }, 25000);

  it('keeps the morning arrival when the afternoon is uploaded separately', async () => {
    const ctx = await scaffold();

    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 2).toISOString() }]);
    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(15, 30).toISOString() }]);

    const record = await Attendance.findOne({ userId: ctx.teacher.user._id });
    expect(record.checkInAt).toEqual(istToday(8, 2));
    expect(record.checkOutAt).toEqual(istToday(15, 30));
  }, 25000);

  it('marks an arrival after the grace period as late', async () => {
    const ctx = await scaffold();
    await School.updateOne(
      { _id: ctx.school._id },
      { $set: { 'attendanceHours.startTime': '08:00', 'attendanceHours.lateGraceMinutes': 10 } }
    );

    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 45).toISOString() }]);

    const record = await Attendance.findOne({ userId: ctx.teacher.user._id });
    expect(record.status).toBe('late');
  }, 25000);

  it('does not call somebody late inside the grace period', async () => {
    const ctx = await scaffold();
    await School.updateOne(
      { _id: ctx.school._id },
      { $set: { 'attendanceHours.startTime': '08:00', 'attendanceHours.lateGraceMinutes': 10 } }
    );

    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 7).toISOString() }]);

    const record = await Attendance.findOne({ userId: ctx.teacher.user._id });
    expect(record.status).toBe('present');
  }, 25000);

  it('does not overrule a record a person entered by hand', async () => {
    const ctx = await scaffold();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await Attendance.create({
      schoolId: ctx.school._id, userId: ctx.teacher.user._id, role: 'teacher',
      date: today, status: 'leave', markedBy: ctx.admin.user._id, source: 'manual',
    });

    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 5).toISOString() }]);

    const record = await Attendance.findOne({ userId: ctx.teacher.user._id });
    // If the office has already put somebody on leave, a card scan is not grounds to silently
    // overrule them.
    expect(record.status).toBe('leave');
    // The punch is still linked, so the discrepancy is visible rather than lost.
    const stored = await DevicePunch.findOne({ externalId: 'CARD-001' });
    expect(String(stored.attendanceId)).toBe(String(record._id));
  }, 25000);
});

describe('cards nobody has enrolled', () => {
  it('keeps an unknown card scan instead of dropping it', async () => {
    const ctx = await scaffold({ enrol: false });

    const res = await punch(ctx, [{ externalId: 'CARD-999', punchedAt: istToday(8, 5).toISOString() }]);

    expect(res.body.data.accepted).toBe(1);
    expect(res.body.data.unmatched).toBe(1);
    expect(await Attendance.countDocuments({})).toBe(0);
    expect(await DevicePunch.countDocuments({ userId: null })).toBe(1);
  }, 25000);

  it('lists the unknown cards so the office can act on them', async () => {
    const ctx = await scaffold({ enrol: false });
    await punch(ctx, [
      { externalId: 'CARD-999', punchedAt: istToday(8, 5).toISOString() },
      { externalId: 'CARD-999', punchedAt: istToday(15, 5).toISOString() },
    ]);

    const res = await request(app)
      .get('/api/v1/attendance-devices/unmatched')
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].externalId).toBe('CARD-999');
    expect(res.body.data[0].punches).toBe(2);
  }, 25000);

  it('turns already-collected scans into attendance once the card is enrolled', async () => {
    const ctx = await scaffold({ enrol: false });
    await punch(ctx, [{ externalId: 'CARD-777', punchedAt: istToday(8, 5).toISOString() }]);

    await request(app)
      .post('/api/v1/attendance-devices/credentials')
      .set('Authorization', `Bearer ${ctx.admin.token}`)
      .send({ userId: ctx.teacher.user._id, externalId: 'CARD-777', role: 'teacher' });

    const replay = await request(app)
      .post('/api/v1/attendance-devices/replay')
      .set('Authorization', `Bearer ${ctx.admin.token}`)
      .send({});

    // This is the whole reason raw punches are kept: a late enrolment fixes the past instead of
    // leaving a day of absences to correct by hand.
    expect(replay.body.data.applied).toBe(1);
    const record = await Attendance.findOne({ userId: ctx.teacher.user._id });
    expect(record.checkInAt).toEqual(istToday(8, 5));
  }, 25000);
});

describe('enrolment rules', () => {
  it('refuses to enrol a card that already belongs to somebody', async () => {
    const ctx = await scaffold();
    const other = await mkUser('Teacher', ctx.school._id);

    const res = await request(app)
      .post('/api/v1/attendance-devices/credentials')
      .set('Authorization', `Bearer ${ctx.admin.token}`)
      .send({ userId: other.user._id, externalId: 'CARD-001', role: 'teacher' });

    expect(res.status).toBe(409);
  }, 25000);

  it('lets a revoked card be reissued to somebody else', async () => {
    const ctx = await scaffold();
    const credential = await AttendanceCredential.findOne({ externalId: 'CARD-001' });
    await request(app)
      .delete(`/api/v1/attendance-devices/credentials/${credential._id}`)
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    const other = await mkUser('Teacher', ctx.school._id);
    const res = await request(app)
      .post('/api/v1/attendance-devices/credentials')
      .set('Authorization', `Bearer ${ctx.admin.token}`)
      .send({ userId: other.user._id, externalId: 'CARD-001', role: 'teacher' });

    // Cards do get recycled; a plain unique index would block this forever.
    expect(res.status).toBe(201);
  }, 25000);

  it('will not enrol a user from another school', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();

    const res = await request(app)
      .post('/api/v1/attendance-devices/credentials')
      .set('Authorization', `Bearer ${mine.admin.token}`)
      .send({ userId: theirs.teacher.user._id, externalId: 'CARD-XYZ', role: 'teacher' });

    expect(res.status).toBe(404);
  }, 25000);

  it('stops a revoked card from marking attendance', async () => {
    const ctx = await scaffold();
    const credential = await AttendanceCredential.findOne({ externalId: 'CARD-001' });
    await request(app)
      .delete(`/api/v1/attendance-devices/credentials/${credential._id}`)
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    const res = await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 5).toISOString() }]);

    expect(res.body.data.unmatched).toBe(1);
    expect(await Attendance.countDocuments({})).toBe(0);
  }, 25000);
});

describe('managing devices', () => {
  it('shows the secret once at registration and never again', async () => {
    const ctx = await scaffold();

    const list = await request(app)
      .get('/api/v1/attendance-devices')
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    expect(ctx.secret).toEqual(expect.any(String));
    expect(list.body.data[0].secret).toBeUndefined();
  }, 25000);

  it('refuses to delete a device whose punches are behind real attendance', async () => {
    const ctx = await scaffold();
    await punch(ctx, [{ externalId: 'CARD-001', punchedAt: istToday(8, 5).toISOString() }]);

    const res = await request(app)
      .delete(`/api/v1/attendance-devices/${ctx.device._id}`)
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Deactivate/);
  }, 25000);

  it('flags a reader that has gone quiet', async () => {
    const ctx = await scaffold();

    const res = await request(app)
      .get('/api/v1/attendance-devices/summary')
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    // A silent reader marks nobody, and everyone it covers reads as absent — which looks exactly
    // like a school where nobody turned up.
    expect(res.body.data.silentDevices).toHaveLength(1);
  }, 25000);

  it('does not show one school the devices of another', async () => {
    const mine = await scaffold();
    await scaffold();

    const res = await request(app)
      .get('/api/v1/attendance-devices')
      .set('Authorization', `Bearer ${mine.admin.token}`);

    expect(res.body.data).toHaveLength(1);
  }, 25000);

  it('does not let one school reach another school device', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();

    const res = await request(app)
      .put(`/api/v1/attendance-devices/${theirs.device._id}`)
      .set('Authorization', `Bearer ${mine.admin.token}`)
      .send({ name: 'Hijacked' });

    expect(res.status).toBe(404);
  }, 25000);
});
