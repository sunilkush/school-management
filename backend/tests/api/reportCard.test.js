import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createActiveAcademicYear, loginAs } from '../helpers/fixtures.js';
import { ExamResult } from '../../src/models/ExamResult.model.js';
import { ReportCard } from '../../src/models/ReportCard.model.js';
import { ReportCardTemplate } from '../../src/models/ReportCardTemplate.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const MATHS = new mongoose.Types.ObjectId();
const SCIENCE = new mongoose.Types.ObjectId();

/** One school, an admin logged in, a class, and two exams weighted 30/70. */
const scaffold = async () => {
  const school = await createSchool();
  const year = await createActiveAcademicYear({ schoolId: school._id });
  const adminRole = await createRole('School Admin', { schoolId: school._id });
  const { user: admin } = await createUser({
    name: 'Admin', email: `admin-${Date.now()}@rc.test`, roleId: adminRole._id, schoolId: school._id,
  });
  const token = await loginAs(admin.email);

  const schoolClassId = new mongoose.Types.ObjectId();
  const unitTestId = new mongoose.Types.ObjectId();
  const finalsId = new mongoose.Types.ObjectId();

  const template = await ReportCardTemplate.create({
    schoolId: school._id,
    academicYearId: year._id,
    name: 'Term 1',
    exams: [
      { examId: unitTestId, weightage: 30 },
      { examId: finalsId, weightage: 70 },
    ],
    coScholasticAreas: [{ name: 'Discipline' }, { name: 'Sports' }],
    status: 'active',
  });

  return { school, year, token, schoolClassId, unitTestId, finalsId, template };
};

const seedResult = ({ school, year, examId, studentId, schoolClassId, maths, science }) =>
  ExamResult.create({
    schoolId: school._id,
    academicYearId: year._id,
    examId,
    studentId,
    schoolClassId,
    subjects: [
      { subjectId: MATHS, subjectName: 'Maths', obtainedMarks: maths.got, totalMarks: maths.max, passingMarks: maths.pass, isPassed: maths.got >= maths.pass },
      { subjectId: SCIENCE, subjectName: 'Science', obtainedMarks: science.got, totalMarks: science.max, passingMarks: science.pass, isPassed: science.got >= science.pass },
    ],
    totalObtainedMarks: maths.got + science.got,
    totalMaximumMarks: maths.max + science.max,
    percentage: ((maths.got + science.got) / (maths.max + science.max)) * 100,
    grade: 'B',
    resultStatus: 'PASS',
  });

describe('POST /report-cards/generate', () => {
  it('weights each exam by the template and grades the result', async () => {
    const ctx = await scaffold();
    const studentId = new mongoose.Types.ObjectId();

    // Unit test (30%): Maths 20/50. Finals (70%): Maths 45/50.
    // Weighted Maths = (0.40*30 + 0.90*70) / 100 = 75%
    await seedResult({ ...ctx, examId: ctx.unitTestId, studentId, maths: { got: 20, max: 50, pass: 17 }, science: { got: 25, max: 50, pass: 17 } });
    await seedResult({ ...ctx, examId: ctx.finalsId, studentId, maths: { got: 45, max: 50, pass: 17 }, science: { got: 35, max: 50, pass: 17 } });

    const res = await request(app)
      .post('/api/v1/report-cards/generate')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ templateId: ctx.template._id.toString(), schoolClassId: ctx.schoolClassId.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.generated).toBe(1);

    const card = await ReportCard.findOne({ studentId });
    const maths = card.subjects.find((s) => s.subjectName === 'Maths');
    expect(maths.weightedPercentage).toBe(75);
    expect(maths.components).toHaveLength(2);
    // Science: (0.50*30 + 0.70*70) / 100 = 64%
    expect(card.subjects.find((s) => s.subjectName === 'Science').weightedPercentage).toBe(64);
    // Overall is the mean of subject percentages, not of raw marks.
    expect(card.totals.percentage).toBe(69.5);
    expect(card.totals.resultStatus).toBe('PASS');
  }, 20000);

  it('normalises over the exams a student actually sat, so a missed exam does not read as zero', async () => {
    const ctx = await scaffold();
    const studentId = new mongoose.Types.ObjectId();

    // Only the 30%-weighted unit test exists; the finals result is absent.
    await seedResult({ ...ctx, examId: ctx.unitTestId, studentId, maths: { got: 40, max: 50, pass: 17 }, science: { got: 40, max: 50, pass: 17 } });

    await request(app)
      .post('/api/v1/report-cards/generate')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ templateId: ctx.template._id.toString(), schoolClassId: ctx.schoolClassId.toString() });

    const card = await ReportCard.findOne({ studentId });
    // 80% on the only exam sat — not 80% * 0.3 = 24%.
    expect(card.subjects.find((s) => s.subjectName === 'Maths').weightedPercentage).toBe(80);
  }, 20000);

  it('ranks the class densely, so equal percentages share a rank', async () => {
    const ctx = await scaffold();
    const top = new mongoose.Types.ObjectId();
    const tieA = new mongoose.Types.ObjectId();
    const tieB = new mongoose.Types.ObjectId();

    for (const [studentId, got] of [[top, 48], [tieA, 30], [tieB, 30]]) {
      // eslint-disable-next-line no-await-in-loop
      await seedResult({ ...ctx, examId: ctx.finalsId, studentId, maths: { got, max: 50, pass: 17 }, science: { got, max: 50, pass: 17 } });
    }

    await request(app)
      .post('/api/v1/report-cards/generate')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ templateId: ctx.template._id.toString(), schoolClassId: ctx.schoolClassId.toString() });

    expect((await ReportCard.findOne({ studentId: top })).rank).toBe(1);
    expect((await ReportCard.findOne({ studentId: tieA })).rank).toBe(2);
    expect((await ReportCard.findOne({ studentId: tieB })).rank).toBe(2);
  }, 20000);

  it('fails the term when a subject falls below its weighted passing marks', async () => {
    const ctx = await scaffold();
    const studentId = new mongoose.Types.ObjectId();

    await seedResult({ ...ctx, examId: ctx.finalsId, studentId, maths: { got: 10, max: 50, pass: 17 }, science: { got: 45, max: 50, pass: 17 } });

    await request(app)
      .post('/api/v1/report-cards/generate')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ templateId: ctx.template._id.toString(), schoolClassId: ctx.schoolClassId.toString() });

    const card = await ReportCard.findOne({ studentId });
    expect(card.subjects.find((s) => s.subjectName === 'Maths').isPassed).toBe(false);
    expect(card.totals.resultStatus).toBe('FAIL');
  }, 20000);

  it('keeps hand-entered remarks and co-scholastic grades when the term is regenerated', async () => {
    const ctx = await scaffold();
    const studentId = new mongoose.Types.ObjectId();
    const body = { templateId: ctx.template._id.toString(), schoolClassId: ctx.schoolClassId.toString() };

    await seedResult({ ...ctx, examId: ctx.finalsId, studentId, maths: { got: 30, max: 50, pass: 17 }, science: { got: 30, max: 50, pass: 17 } });
    await request(app).post('/api/v1/report-cards/generate').set('Authorization', `Bearer ${ctx.token}`).send(body);

    const card = await ReportCard.findOne({ studentId });
    await request(app)
      .patch(`/api/v1/report-cards/${card._id}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({
        classTeacherRemarks: 'Improving steadily.',
        coScholastic: [{ area: 'Discipline', grade: 'A' }, { area: 'Sports', grade: 'B' }],
      });

    // Marks corrected upward, then regenerated.
    await ExamResult.updateOne({ studentId }, { $set: { 'subjects.0.obtainedMarks': 45 } });
    await request(app).post('/api/v1/report-cards/generate').set('Authorization', `Bearer ${ctx.token}`).send(body);

    const after = await ReportCard.findOne({ studentId });
    expect(after.subjects.find((s) => s.subjectName === 'Maths').weightedPercentage).toBe(90);
    expect(after.classTeacherRemarks).toBe('Improving steadily.');
    expect(after.coScholastic.find((c) => c.area === 'Discipline').grade).toBe('A');
  }, 20000);

  it('refuses to overwrite a published card', async () => {
    const ctx = await scaffold();
    const studentId = new mongoose.Types.ObjectId();
    const body = { templateId: ctx.template._id.toString(), schoolClassId: ctx.schoolClassId.toString() };

    await seedResult({ ...ctx, examId: ctx.finalsId, studentId, maths: { got: 30, max: 50, pass: 17 }, science: { got: 30, max: 50, pass: 17 } });
    await request(app).post('/api/v1/report-cards/generate').set('Authorization', `Bearer ${ctx.token}`).send(body);

    await request(app)
      .post('/api/v1/report-cards/publish')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ templateId: ctx.template._id.toString() });

    await ExamResult.updateOne({ studentId }, { $set: { 'subjects.0.obtainedMarks': 50 } });
    const res = await request(app).post('/api/v1/report-cards/generate').set('Authorization', `Bearer ${ctx.token}`).send(body);

    expect(res.body.data.skippedPublished).toBe(1);
    const after = await ReportCard.findOne({ studentId });
    // Still the published figures — an issued document must not change underneath a parent.
    expect(after.subjects.find((s) => s.subjectName === 'Maths').weightedPercentage).toBe(60);
  }, 20000);
});

describe('report card tenant isolation', () => {
  it('refuses to generate against another school\'s template', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();

    const res = await request(app)
      .post('/api/v1/report-cards/generate')
      .set('Authorization', `Bearer ${mine.token}`)
      .send({ templateId: theirs.template._id.toString(), schoolClassId: theirs.schoolClassId.toString() });

    expect(res.status).toBe(403);
    expect(await ReportCard.countDocuments({})).toBe(0);
  }, 20000);
});
