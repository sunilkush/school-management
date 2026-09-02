import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createActiveAcademicYear, loginAs } from '../helpers/fixtures.js';
import { TimeSlot } from '../../src/models/TimeSlot.model.js';
import { Timetable } from '../../src/models/Timetable.model.js';
import { ClassSubject } from '../../src/models/SchoolClassSubject.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const MATHS = new mongoose.Types.ObjectId();
const SCIENCE = new mongoose.Types.ObjectId();
const DAYS = ['monday', 'tuesday'];

let seq = 0;

/** A school with `slotCount` period slots and an admin who can generate. */
const scaffold = async ({ slotCount = 2 } = {}) => {
  const school = await createSchool();
  const year = await createActiveAcademicYear({ schoolId: school._id });

  const adminRole = await createRole('School Admin', { schoolId: school._id });
  const { user: admin } = await createUser({
    name: 'Admin', email: `admin-${Date.now()}-${seq++}@gen.test`, roleId: adminRole._id, schoolId: school._id,
  });
  const token = await loginAs(admin.email);

  for (let i = 1; i <= slotCount; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await TimeSlot.create({
      schoolId: school._id, academicYearId: year._id, name: `Period ${i}`,
      startTime: `0${8 + i}:00`, endTime: `0${8 + i}:40`, order: i, type: 'period',
    });
  }

  return { school, year, token, admin };
};

const teacherRoleFor = async (school) => createRole('Teacher', { schoolId: school._id });

const makeTeacherUser = async ({ school, roleId, name }) => {
  seq += 1;
  const { user } = await createUser({
    name, email: `t${seq}-${Date.now()}@gen.test`, roleId, schoolId: school._id,
  });
  return user;
};

const plan = ({ school, year, schoolClassId, sectionId, subjectId, teacherId, periodPerWeek }) =>
  ClassSubject.create({
    schoolId: school._id, academicYearId: year._id, schoolClassId, sectionId,
    subjectId, teacherId, periodPerWeek, status: 'active',
  });

const generate = (ctx, body) =>
  request(app)
    .post('/api/v1/timetable/generate')
    .set('Authorization', `Bearer ${ctx.token}`)
    .send({ academicYearId: ctx.year._id.toString(), workingDays: DAYS, ...body });

describe('POST /timetable/generate', () => {
  it('previews without writing anything until commit is asked for', async () => {
    const ctx = await scaffold();
    const role = await teacherRoleFor(ctx.school);
    const teacher = await makeTeacherUser({ school: ctx.school, roleId: role._id, name: 'Maths Teacher' });
    const schoolClassId = new mongoose.Types.ObjectId();
    const sectionId = new mongoose.Types.ObjectId();

    await plan({ school: ctx.school, year: ctx.year, schoolClassId, sectionId, subjectId: MATHS, teacherId: teacher._id, periodPerWeek: 4 });

    const preview = await generate(ctx, { targets: [{ schoolClassId, sectionId }] });

    expect(preview.status).toBe(200);
    expect(preview.body.data.committed).toBe(false);
    expect(preview.body.data.entries).toHaveLength(4); // 2 days x 2 slots
    expect(await Timetable.countDocuments({})).toBe(0);

    const applied = await generate(ctx, { targets: [{ schoolClassId, sectionId }], commit: true });
    expect(applied.body.data.committed).toBe(true);
    expect(await Timetable.countDocuments({})).toBe(4);
  }, 25000);

  it('never double-books a teacher shared between two sections', async () => {
    const ctx = await scaffold();
    const role = await teacherRoleFor(ctx.school);
    const shared = await makeTeacherUser({ school: ctx.school, roleId: role._id, name: 'Shared Teacher' });

    const classA = new mongoose.Types.ObjectId();
    const sectionA = new mongoose.Types.ObjectId();
    const classB = new mongoose.Types.ObjectId();
    const sectionB = new mongoose.Types.ObjectId();

    // The same teacher owes 4 periods to each of two sections, but only 4 slots exist in total.
    await plan({ school: ctx.school, year: ctx.year, schoolClassId: classA, sectionId: sectionA, subjectId: MATHS, teacherId: shared._id, periodPerWeek: 4 });
    await plan({ school: ctx.school, year: ctx.year, schoolClassId: classB, sectionId: sectionB, subjectId: MATHS, teacherId: shared._id, periodPerWeek: 4 });

    const res = await generate(ctx, {
      targets: [{ schoolClassId: classA, sectionId: sectionA }, { schoolClassId: classB, sectionId: sectionB }],
      commit: true,
    });

    const rows = await Timetable.find({ teacherId: shared._id }).lean();
    const slotKeys = rows.map((r) => `${r.dayOfWeek}|${r.timeSlotId}`);
    expect(new Set(slotKeys).size).toBe(slotKeys.length); // no two rows share a day+slot

    // Only 4 slots exist, so the second section's demand cannot be met — and that is reported.
    expect(res.body.data.unmet.length).toBeGreaterThan(0);
    expect(res.body.data.unmet[0].shortfall).toBeGreaterThan(0);
  }, 25000);

  it('respects an existing section that is not being regenerated', async () => {
    const ctx = await scaffold();
    const role = await teacherRoleFor(ctx.school);
    const shared = await makeTeacherUser({ school: ctx.school, roleId: role._id, name: 'Shared Teacher' });

    const otherClass = new mongoose.Types.ObjectId();
    const otherSection = new mongoose.Types.ObjectId();
    const slots = await TimeSlot.find({ schoolId: ctx.school._id }).sort({ order: 1 }).lean();

    // A fixed commitment elsewhere that generation must not clash with.
    await Timetable.create({
      schoolId: ctx.school._id, academicYearId: ctx.year._id,
      schoolClassId: otherClass, sectionId: otherSection,
      dayOfWeek: 'monday', timeSlotId: slots[0]._id, subjectId: MATHS, teacherId: shared._id, type: 'regular',
    });

    const targetClass = new mongoose.Types.ObjectId();
    const targetSection = new mongoose.Types.ObjectId();
    await plan({ school: ctx.school, year: ctx.year, schoolClassId: targetClass, sectionId: targetSection, subjectId: MATHS, teacherId: shared._id, periodPerWeek: 4 });

    await generate(ctx, { targets: [{ schoolClassId: targetClass, sectionId: targetSection }], commit: true });

    const clash = await Timetable.countDocuments({
      teacherId: shared._id, dayOfWeek: 'monday', timeSlotId: slots[0]._id,
    });
    expect(clash).toBe(1); // still only the pre-existing commitment
  }, 25000);

  it('spreads a subject across days rather than stacking it in one', async () => {
    const ctx = await scaffold({ slotCount: 2 });
    const role = await teacherRoleFor(ctx.school);
    const mathsT = await makeTeacherUser({ school: ctx.school, roleId: role._id, name: 'Maths Teacher' });
    const sciT = await makeTeacherUser({ school: ctx.school, roleId: role._id, name: 'Science Teacher' });

    const schoolClassId = new mongoose.Types.ObjectId();
    const sectionId = new mongoose.Types.ObjectId();
    await plan({ school: ctx.school, year: ctx.year, schoolClassId, sectionId, subjectId: MATHS, teacherId: mathsT._id, periodPerWeek: 2 });
    await plan({ school: ctx.school, year: ctx.year, schoolClassId, sectionId, subjectId: SCIENCE, teacherId: sciT._id, periodPerWeek: 2 });

    await generate(ctx, { targets: [{ schoolClassId, sectionId }], commit: true });

    const monday = await Timetable.find({ schoolClassId, dayOfWeek: 'monday' }).lean();
    const subjectsOnMonday = new Set(monday.map((r) => String(r.subjectId)));
    // Both subjects appear on Monday rather than one taking the whole day.
    expect(subjectsOnMonday.size).toBe(2);
  }, 25000);

  it('rejects a request with no targets', async () => {
    const ctx = await scaffold();
    const res = await generate(ctx, { targets: [] });
    expect(res.status).toBe(400);
  }, 25000);
});
