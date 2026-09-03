import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool, createRole, createUser, createStudent,
  createActiveAcademicYear, createEnrollment, loginAs,
} from '../helpers/fixtures.js';
import { Role } from '../../src/models/Roles.model.js';
import { Attendance } from '../../src/models/attendance.model.js';
import { OnlineClass } from '../../src/models/OnlineClass.model.js';
import { OnlineClassJoin } from '../../src/models/OnlineClassJoin.model.js';

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
    name: roleName, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@live.test`,
    roleId: role._id, schoolId,
  });
  return { user, token: await loginAs(user.email) };
};

const minutes = (n) => new Date(Date.now() + n * 60000);

const scaffold = async () => {
  const school = await createSchool();
  const teacher = await mkUser('Teacher', school._id);
  const year = await createActiveAcademicYear({ schoolId: school._id });
  const schoolClassId = new mongoose.Types.ObjectId();
  const sectionId = new mongoose.Types.ObjectId();
  return { school, teacher, year, schoolClassId, sectionId };
};

/** A student enrolled in the scaffold's class and section. */
const addStudent = async (ctx, { sectionId = ctx.sectionId, schoolClassId = ctx.schoolClassId } = {}) => {
  const account = await mkUser('Student', ctx.school._id);
  const student = await createStudent({ userId: account.user._id, schoolId: ctx.school._id });
  await createEnrollment({
    studentId: student._id, schoolId: ctx.school._id, academicYearId: ctx.year._id,
    schoolClassId, sectionId,
  });
  return { ...account, student };
};

const schedule = (ctx, body = {}, actor = ctx.teacher) =>
  request(app).post('/api/v1/online-classes').set('Authorization', `Bearer ${actor.token}`)
    .send({
      schoolClassId: ctx.schoolClassId,
      sectionId: ctx.sectionId,
      title: 'Algebra revision',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      provider: 'google_meet',
      scheduledStart: minutes(5).toISOString(),
      scheduledEnd: minutes(65).toISOString(),
      academicYearId: ctx.year._id,
      ...body,
    });

const listFor = (actor) =>
  request(app).get('/api/v1/online-classes').set('Authorization', `Bearer ${actor.token}`);

const join = (id, actor) =>
  request(app).post(`/api/v1/online-classes/${id}/join`).set('Authorization', `Bearer ${actor.token}`).send({});

describe('scheduling', () => {
  it('schedules a class', async () => {
    const ctx = await scaffold();

    const res = await schedule(ctx);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('scheduled');
    expect(String(res.body.data.teacherId)).toBe(String(ctx.teacher.user._id));
  }, 25000);

  it('refuses a link that is not a URL', async () => {
    const ctx = await scaffold();

    const res = await schedule(ctx, { meetingLink: 'ask me on whatsapp' });

    // Rejected here rather than rendered as a broken button in front of thirty students.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await OnlineClass.countDocuments({})).toBe(0);
  }, 25000);

  it('refuses a class that ends before it starts', async () => {
    const ctx = await scaffold();

    const res = await schedule(ctx, {
      scheduledStart: minutes(60).toISOString(), scheduledEnd: minutes(30).toISOString(),
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 25000);

  it('cancels rather than deletes', async () => {
    const ctx = await scaffold();
    const session = (await schedule(ctx)).body.data;

    const res = await request(app).delete(`/api/v1/online-classes/${session._id}`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`).send({ reason: 'Teacher unwell' });

    // Students were told it was happening; the record of it being called off is the answer to
    // "why did nobody turn up".
    expect(res.body.data.status).toBe('cancelled');
    expect(await OnlineClass.countDocuments({})).toBe(1);
  }, 25000);

  it('will not let a finished class be rescheduled, but still takes its recording', async () => {
    const ctx = await scaffold();
    const session = (await schedule(ctx)).body.data;
    await request(app).patch(`/api/v1/online-classes/${session._id}/status`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`).send({ status: 'completed' });

    const reschedule = await request(app).patch(`/api/v1/online-classes/${session._id}`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`)
      .send({ scheduledStart: minutes(120).toISOString() });
    const recording = await request(app).patch(`/api/v1/online-classes/${session._id}`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`)
      .send({ recordingUrl: 'https://drive.google.com/file/xyz' });

    expect(reschedule.status).toBe(400);
    expect(recording.status).toBe(200);
  }, 25000);
});

describe('what a student sees', () => {
  it('only lists classes for their own class and section', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    await schedule(ctx);
    await schedule(ctx, { sectionId: new mongoose.Types.ObjectId(), title: 'Another section' });

    const res = await listFor(student);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Algebra revision');
  }, 25000);

  it('sees a whole-class session that has no section set', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    await schedule(ctx, { sectionId: null, title: 'Whole class assembly' });

    const res = await listFor(student);

    expect(res.body.data).toHaveLength(1);
  }, 25000);

  it('hides the link until shortly before the class', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    await schedule(ctx, {
      scheduledStart: minutes(300).toISOString(),
      scheduledEnd: minutes(360).toISOString(),
      linkVisibleBeforeMin: 15,
    });

    const res = await listFor(student);

    // A link visible days in advance gets forwarded outside the school.
    expect(res.body.data[0].meetingLink).toBeNull();
    expect(res.body.data[0].canJoin).toBe(false);
    // And it says when it opens, so nobody sits refreshing an empty page.
    expect(res.body.data[0].joinOpensAt).toEqual(expect.any(String));
  }, 25000);

  it('shows the link once the window opens', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    await schedule(ctx, { linkVisibleBeforeMin: 15 });

    const res = await listFor(student);

    expect(res.body.data[0].canJoin).toBe(true);
    expect(res.body.data[0].meetingLink).toBe('https://meet.google.com/abc-defg-hij');
  }, 25000);

  it('never hides the link from the teacher', async () => {
    const ctx = await scaffold();
    await schedule(ctx, {
      scheduledStart: minutes(300).toISOString(), scheduledEnd: minutes(360).toISOString(),
    });

    const res = await listFor(ctx.teacher);

    // Staff have to set the room up before anyone arrives.
    expect(res.body.data[0].meetingLink).toBe('https://meet.google.com/abc-defg-hij');
  }, 25000);
});

describe('joining', () => {
  it('hands back the link and records the join in one step', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;

    const res = await join(session._id, student);

    expect(res.body.data.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
    // Separate endpoints would let a link be fetched without a matching log, leaving the
    // register wrong exactly when somebody needs it.
    expect(await OnlineClassJoin.countDocuments({ onlineClassId: session._id })).toBe(1);
  }, 25000);

  it('counts people, not clicks, when somebody rejoins', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;

    await join(session._id, student);
    await join(session._id, student);

    const rows = await OnlineClassJoin.find({ onlineClassId: session._id }).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].joinCount).toBe(2);
  }, 25000);

  it('refuses a student from another section', async () => {
    const ctx = await scaffold();
    const outsider = await addStudent(ctx, { sectionId: new mongoose.Types.ObjectId() });
    const session = (await schedule(ctx)).body.data;

    const res = await join(session._id, outsider);

    expect(res.status).toBe(403);
  }, 25000);

  it('refuses before the link window opens', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx, {
      scheduledStart: minutes(300).toISOString(), scheduledEnd: minutes(360).toISOString(),
    })).body.data;

    const res = await join(session._id, student);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/opens at/i);
  }, 25000);

  it('refuses a cancelled class', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;
    await request(app).delete(`/api/v1/online-classes/${session._id}`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`).send({});

    const res = await join(session._id, student);

    expect(res.status).toBe(400);
  }, 25000);

  it('will not reach a class in another school', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    const session = (await schedule(theirs)).body.data;

    const res = await join(session._id, mine.teacher);

    expect(res.status).toBe(404);
  }, 25000);
});

describe('the join log', () => {
  it('calls itself joins, not attendance', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;
    await join(session._id, student);

    const res = await request(app).get(`/api/v1/online-classes/${session._id}/joins`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`);

    expect(res.body.data.joined).toBe(1);
    // The wording matters: this is a click, not a lesson sat through.
    expect(res.body.data.note).toMatch(/not verified attendance/i);
  }, 25000);

  it('is not visible to a student', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;

    const res = await request(app).get(`/api/v1/online-classes/${session._id}/joins`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(res.status).toBe(403);
  }, 25000);
});

describe('marking the register from joins', () => {
  it('does not mark anybody until a teacher asks it to', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;

    await join(session._id, student);

    // Joining alone must never produce attendance — a click is not a lesson attended.
    expect(await Attendance.countDocuments({})).toBe(0);
  }, 25000);

  it('marks the joiners present when the teacher does ask', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;
    await join(session._id, student);

    const res = await request(app).post(`/api/v1/online-classes/${session._id}/mark-attendance`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`).send({});

    expect(res.body.data.marked).toBe(1);
    const record = await Attendance.findOne({ userId: student.user._id });
    expect(record.status).toBe('present');
    // Distinguishable from a row a teacher typed and from a card scan.
    expect(record.source).toBe('online');
  }, 25000);

  it('leaves a record somebody entered by hand alone', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;
    await join(session._id, student);

    const date = new Date(session.scheduledStart);
    date.setUTCHours(0, 0, 0, 0);
    await Attendance.create({
      schoolId: ctx.school._id, userId: student.user._id, role: 'student',
      date, status: 'leave', markedBy: ctx.teacher.user._id, source: 'manual',
    });

    const res = await request(app).post(`/api/v1/online-classes/${session._id}/mark-attendance`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`).send({});

    expect(res.body.data.marked).toBe(0);
    expect(res.body.data.skipped).toHaveLength(1);
    const record = await Attendance.findOne({ userId: student.user._id });
    expect(record.status).toBe('leave');
  }, 25000);

  it('says so when nobody turned up', async () => {
    const ctx = await scaffold();
    await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;

    const res = await request(app).post(`/api/v1/online-classes/${session._id}/mark-attendance`)
      .set('Authorization', `Bearer ${ctx.teacher.token}`).send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/nothing to mark/i);
  }, 25000);

  it('is not something a student can trigger for themselves', async () => {
    const ctx = await scaffold();
    const student = await addStudent(ctx);
    const session = (await schedule(ctx)).body.data;
    await join(session._id, student);

    const res = await request(app).post(`/api/v1/online-classes/${session._id}/mark-attendance`)
      .set('Authorization', `Bearer ${student.token}`).send({});

    expect(res.status).toBe(403);
  }, 25000);
});
