import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool, createRole, createUser, createStudent, createEnrollment,
  createActiveAcademicYear, loginAs,
} from '../helpers/fixtures.js';
import { Exam } from '../../src/models/Exam.model.js';
import { AdmitCard } from '../../src/models/AdmitCard.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

/**
 * An exam scoped to ONE section, whose Section document no longer exists.
 *
 * getExamForAdmitCards populates sectionId, so a missing Section made it null — the old
 * `if (exam.sectionId?._id || exam.sectionId)` then evaluated false, the section filter was
 * dropped, and admit cards were issued to the whole class.
 */
const scaffold = async () => {
  const school = await createSchool();
  const year = await createActiveAcademicYear({ schoolId: school._id });

  const adminRole = await createRole('School Admin', { schoolId: school._id });
  const { user: admin } = await createUser({
    name: 'Admin', email: `admin-${Date.now()}@ac.test`, roleId: adminRole._id, schoolId: school._id,
  });
  const token = await loginAs(admin.email);

  const schoolClassId = new mongoose.Types.ObjectId();
  const examSectionId = new mongoose.Types.ObjectId();   // no Section doc is ever created
  const otherSectionId = new mongoose.Types.ObjectId();

  const studentRole = await createRole('Student', { schoolId: school._id });
  const mk = async (name, sectionId) => {
    const { user } = await createUser({
      name, email: `${name.replace(/\s/g, '')}-${Date.now()}@ac.test`,
      roleId: studentRole._id, schoolId: school._id,
    });
    const student = await createStudent({ userId: user._id, schoolId: school._id });
    await createEnrollment({
      studentId: student._id, schoolId: school._id, academicYearId: year._id,
      schoolClassId, sectionId,
    });
    return user;
  };

  await mk('In Section', examSectionId);
  await mk('Other Section', otherSectionId);

  const exam = await Exam.create({
    schoolId: school._id, academicYearId: year._id, title: 'Term 1 Maths',
    schoolClassId, sectionId: examSectionId, subjectId: new mongoose.Types.ObjectId(),
    examDate: new Date('2026-10-01'),
    startTime: new Date('2026-10-01T09:00:00Z'), endTime: new Date('2026-10-01T11:00:00Z'),
    durationMinutes: 120, totalMarks: 100, passingMarks: 33, createdBy: admin._id,
  });

  return { school, token, exam };
};

describe('POST /exams/:id/admit-cards/generate', () => {
  it('keeps the section filter when the Section document is gone', async () => {
    const { token, exam } = await scaffold();

    const res = await request(app)
      .post(`/api/v1/exams/${exam._id}/admit-cards/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBeLessThan(400);

    const cards = await AdmitCard.find({ examId: exam._id }).lean();
    // Only the pupil actually in the exam's section — not the whole class.
    expect(cards).toHaveLength(1);
    expect(cards[0].studentName).toBe('In Section');
  }, 25000);
});
