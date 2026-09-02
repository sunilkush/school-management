import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createActiveAcademicYear, loginAs } from '../helpers/fixtures.js';
import { Timetable } from '../../src/models/Timetable.model.js';
import { TimeSlot } from '../../src/models/TimeSlot.model.js';
import { Teacher } from '../../src/models/teacherAssignment.model.js';
import { LeaveRequest } from '../../src/models/LeaveRequest.model.js';
import { Substitution } from '../../src/models/Substitution.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

// A Monday, fixed so the weekday never drifts with the clock.
const MONDAY = '2026-09-07';
const MATHS = new mongoose.Types.ObjectId();
const SCIENCE = new mongoose.Types.ObjectId();

// Roles.model.js has a unique index on { name, schoolId }, so the school's single "Teacher" role
// is created once in scaffold() and every teacher reuses it — creating one per teacher collides.
let seq = 0;
const makeTeacher = async ({ school, year, name, subjectId, roleId }) => {
  seq += 1;
  const { user } = await createUser({
    name, email: `t${seq}-${Date.now()}@sub.test`, roleId, schoolId: school._id,
  });
  await Teacher.create({
    teacherId: user._id, schoolId: school._id, academicYearId: year._id, subjectId, status: 'active',
  });
  return user;
};

/** School + admin + two slots + a class, with `absent` teaching period 1 on Monday. */
const scaffold = async () => {
  const school = await createSchool();
  const year = await createActiveAcademicYear({ schoolId: school._id });

  const adminRole = await createRole('School Admin', { schoolId: school._id });
  const { user: admin } = await createUser({
    name: 'Admin', email: `admin-${Date.now()}@sub.test`, roleId: adminRole._id, schoolId: school._id,
  });
  const token = await loginAs(admin.email);

  const slot1 = await TimeSlot.create({
    schoolId: school._id, academicYearId: year._id, name: 'Period 1',
    startTime: '09:00', endTime: '09:40', order: 1,
  });
  const slot2 = await TimeSlot.create({
    schoolId: school._id, academicYearId: year._id, name: 'Period 2',
    startTime: '09:45', endTime: '10:25', order: 2,
  });

  const schoolClassId = new mongoose.Types.ObjectId();
  const sectionId = new mongoose.Types.ObjectId();

  const teacherRole = await createRole('Teacher', { schoolId: school._id });
  const absent = await makeTeacher({ school, year, name: 'Absent Teacher', subjectId: MATHS, roleId: teacherRole._id });

  const period = await Timetable.create({
    schoolId: school._id, academicYearId: year._id, schoolClassId, sectionId,
    dayOfWeek: 'monday', timeSlotId: slot1._id, subjectId: MATHS, teacherId: absent._id, type: 'regular',
  });

  return { school, year, token, slot1, slot2, schoolClassId, sectionId, absent, period, teacherRole };
};

const planFor = (ctx, extra = '') =>
  request(app)
    .get(`/api/v1/substitutions/plan?date=${MONDAY}&academicYearId=${ctx.year._id}${extra}`)
    .set('Authorization', `Bearer ${ctx.token}`);

describe('GET /substitutions/plan', () => {
  it('lists the periods an approved leave leaves uncovered', async () => {
    const ctx = await scaffold();
    await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Free Teacher', subjectId: MATHS });

    await LeaveRequest.create({
      schoolId: ctx.school._id, userId: ctx.absent._id, role: 'teacher', leaveType: 'sick',
      startDate: new Date(`${MONDAY}T00:00:00Z`), endDate: new Date(`${MONDAY}T00:00:00Z`),
      totalDays: 1, reason: 'Fever', status: 'approved',
    });

    const res = await planFor(ctx);

    expect(res.status).toBe(200);
    expect(res.body.data.dayOfWeek).toBe('monday');
    expect(res.body.data.periods).toHaveLength(1);
    expect(String(res.body.data.periods[0].timetableId)).toBe(String(ctx.period._id));
    expect(res.body.data.periods[0].leaveRequestId).toBeTruthy();
  }, 20000);

  it('accepts an ad-hoc absence for a teacher with no leave on record', async () => {
    const ctx = await scaffold();
    await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Free Teacher', subjectId: MATHS });

    const res = await planFor(ctx, `&absentTeacherIds=${ctx.absent._id}`);

    expect(res.body.data.periods).toHaveLength(1);
    expect(res.body.data.periods[0].leaveRequestId).toBeNull();
  }, 20000);

  it('ranks a teacher of the same subject above one who is merely free', async () => {
    const ctx = await scaffold();
    await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Other Subject', subjectId: SCIENCE });
    const sameSubject = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Same Subject', subjectId: MATHS });

    const res = await planFor(ctx, `&absentTeacherIds=${ctx.absent._id}`);
    const candidates = res.body.data.periods[0].candidates;

    expect(String(candidates[0].teacherId)).toBe(String(sameSubject._id));
    expect(candidates[0].teachesSubject).toBe(true);
    expect(candidates.map((c) => c.name)).toContain('Other Subject');
  }, 20000);

  it('excludes a teacher already teaching in that slot, and the absent teacher themselves', async () => {
    const ctx = await scaffold();
    const busy = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Busy Teacher', subjectId: MATHS });
    await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Free Teacher', subjectId: MATHS });

    // Busy already has another class in the very same slot.
    await Timetable.create({
      schoolId: ctx.school._id, academicYearId: ctx.year._id,
      schoolClassId: new mongoose.Types.ObjectId(), sectionId: new mongoose.Types.ObjectId(),
      dayOfWeek: 'monday', timeSlotId: ctx.slot1._id, subjectId: MATHS, teacherId: busy._id, type: 'regular',
    });

    const res = await planFor(ctx, `&absentTeacherIds=${ctx.absent._id}`);
    const names = res.body.data.periods[0].candidates.map((c) => c.name);

    expect(names).toContain('Free Teacher');
    expect(names).not.toContain('Busy Teacher');
    expect(names).not.toContain('Absent Teacher');
  }, 20000);
});

describe('POST /substitutions', () => {
  const assign = (ctx, substituteTeacherId, date = MONDAY) =>
    request(app)
      .post('/api/v1/substitutions')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({
        date,
        timetableId: ctx.period._id.toString(),
        substituteTeacherId: substituteTeacherId.toString(),
        academicYearId: ctx.year._id.toString(),
      });

  it('assigns cover without touching the recurring timetable', async () => {
    const ctx = await scaffold();
    const free = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Free Teacher', subjectId: MATHS });

    const res = await assign(ctx, free._id);
    expect(res.status).toBe(201);

    const sub = await Substitution.findOne({ timetableId: ctx.period._id });
    expect(String(sub.substituteTeacherId)).toBe(String(free._id));
    expect(String(sub.absentTeacherId)).toBe(String(ctx.absent._id));
    expect(sub.status).toBe('assigned');

    // The weekly schedule must be untouched — otherwise every following Monday changes too.
    const period = await Timetable.findById(ctx.period._id);
    expect(String(period.teacherId)).toBe(String(ctx.absent._id));
    expect(period.type).toBe('regular');
  }, 20000);

  it('refuses a teacher who is already teaching in that slot', async () => {
    const ctx = await scaffold();
    const busy = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Busy Teacher', subjectId: MATHS });
    await Timetable.create({
      schoolId: ctx.school._id, academicYearId: ctx.year._id,
      schoolClassId: new mongoose.Types.ObjectId(), sectionId: new mongoose.Types.ObjectId(),
      dayOfWeek: 'monday', timeSlotId: ctx.slot1._id, subjectId: MATHS, teacherId: busy._id, type: 'regular',
    });

    const res = await assign(ctx, busy._id);

    expect(res.status).toBe(400);
    expect(await Substitution.countDocuments({})).toBe(0);
  }, 20000);

  it('refuses a second cover for the same teacher in the same slot on the same date', async () => {
    const ctx = await scaffold();
    const free = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Free Teacher', subjectId: MATHS });
    const otherAbsent = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Also Absent', subjectId: MATHS });

    // A second, different class needing cover in the very same slot.
    const otherPeriod = await Timetable.create({
      schoolId: ctx.school._id, academicYearId: ctx.year._id,
      schoolClassId: new mongoose.Types.ObjectId(), sectionId: new mongoose.Types.ObjectId(),
      dayOfWeek: 'monday', timeSlotId: ctx.slot1._id, subjectId: MATHS, teacherId: otherAbsent._id, type: 'regular',
    });

    expect((await assign(ctx, free._id)).status).toBe(201);

    const second = await request(app)
      .post('/api/v1/substitutions')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({
        date: MONDAY,
        timetableId: otherPeriod._id.toString(),
        substituteTeacherId: free._id.toString(),
        academicYearId: ctx.year._id.toString(),
      });

    expect(second.status).toBe(400);
    expect(await Substitution.countDocuments({ status: 'assigned' })).toBe(1);
  }, 20000);

  it('refuses a date whose weekday does not match the period', async () => {
    const ctx = await scaffold();
    const free = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Free Teacher', subjectId: MATHS });

    // 2026-09-08 is a Tuesday; the period is scheduled on Monday.
    const res = await assign(ctx, free._id, '2026-09-08');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/monday/i);
  }, 20000);

  it('re-assigning the same period replaces the cover instead of duplicating it', async () => {
    const ctx = await scaffold();
    const first = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'First Cover', subjectId: MATHS });
    const second = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Second Cover', subjectId: MATHS });

    await assign(ctx, first._id);
    await assign(ctx, second._id);

    const subs = await Substitution.find({ timetableId: ctx.period._id });
    expect(subs).toHaveLength(1);
    expect(String(subs[0].substituteTeacherId)).toBe(String(second._id));
  }, 20000);
});

describe('substitution register', () => {
  it("lists the day's covers and lets a teacher see only their own duties", async () => {
    const ctx = await scaffold();
    const free = await makeTeacher({ school: ctx.school, year: ctx.year, roleId: ctx.teacherRole._id, name: 'Free Teacher', subjectId: MATHS });

    await request(app)
      .post('/api/v1/substitutions')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({
        date: MONDAY,
        timetableId: ctx.period._id.toString(),
        substituteTeacherId: free._id.toString(),
        academicYearId: ctx.year._id.toString(),
      });

    const register = await request(app)
      .get(`/api/v1/substitutions?date=${MONDAY}`)
      .set('Authorization', `Bearer ${ctx.token}`);
    expect(register.status).toBe(200);
    expect(register.body.data).toHaveLength(1);
    expect(register.body.data[0].substituteTeacherId.name).toBe('Free Teacher');

    const mine = await request(app)
      .get('/api/v1/substitutions/mine')
      .set('Authorization', `Bearer ${await loginAs(free.email)}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
  }, 20000);
});
