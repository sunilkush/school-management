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
import { SurveyResponse } from '../../src/models/SurveyResponse.model.js';
import { SurveyParticipation } from '../../src/models/SurveyParticipation.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

let seq = 0;
let rollSeq = 0;

const roleFor = async (name, schoolId) =>
  (await Role.findOne({ name, schoolId })) || createRole(name, { schoolId });

const mkUser = async (roleName, schoolId) => {
  seq += 1;
  const role = await roleFor(roleName, schoolId);
  const { user } = await createUser({
    name: `${roleName} ${seq}`, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@srv.test`,
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

/** A child in the scaffold's class plus their parent. rollNumber is required — the enrolment
 *  index is unique on it and two nulls collide. */
const addFamily = async (ctx) => {
  rollSeq += 1;
  const child = await mkUser('Student', ctx.school._id);
  const parent = await mkUser('Parent', ctx.school._id);
  const student = await createStudent({ userId: child.user._id, schoolId: ctx.school._id });
  await Student.updateOne({ _id: student._id }, { fatherId: parent.user._id });
  await createEnrollment({
    studentId: student._id, schoolId: ctx.school._id, academicYearId: ctx.year._id,
    schoolClassId: ctx.classId, sectionId: ctx.sectionId, rollNumber: rollSeq,
  });
  return { child, parent };
};

const api = (token) => ({
  get: (p) => request(app).get(`/api/v1/surveys${p}`).set('Authorization', `Bearer ${token}`),
  post: (p, b) => request(app).post(`/api/v1/surveys${p}`).set('Authorization', `Bearer ${token}`).send(b),
  patch: (p, b) => request(app).patch(`/api/v1/surveys${p}`).set('Authorization', `Bearer ${token}`).send(b),
  del: (p) => request(app).delete(`/api/v1/surveys${p}`).set('Authorization', `Bearer ${token}`),
});

const QUESTIONS = [
  { key: 'q1', text: 'How was the meeting?', type: 'rating', required: true },
  { key: 'q2', text: 'Would you come again?', type: 'yes_no' },
  { key: 'q3', text: 'Which part helped most?', type: 'single_choice', options: ['Subject talk', 'Report discussion', 'Facilities tour'] },
  { key: 'q4', text: 'Anything else?', type: 'long_text' },
];

const draft = (ctx, body = {}) =>
  api(ctx.admin.token).post('', {
    title: 'PTM feedback', questions: QUESTIONS, academicYearId: ctx.year._id, ...body,
  });

const open = (ctx, id) => api(ctx.admin.token).post(`/${id}/open`, {});

const openSurveyFor = async (ctx, body = {}) => {
  const family = await addFamily(ctx);
  const survey = (await draft(ctx, body)).body.data;
  await open(ctx, survey._id);
  return { family, survey };
};

describe('building a survey', () => {
  it('saves it as a draft', async () => {
    const ctx = await scaffold();

    const res = await draft(ctx);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
  }, 30000);

  it('refuses a choice question with nothing to choose from', async () => {
    const ctx = await scaffold();

    const res = await draft(ctx, {
      questions: [{ key: 'a', text: 'Pick one', type: 'single_choice', options: ['Only one'] }],
    });

    // Only noticed once it is in front of two hundred parents, otherwise.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toMatch(/at least two options/);
  }, 30000);

  it('refuses two questions sharing a key', async () => {
    const ctx = await scaffold();

    const res = await draft(ctx, {
      questions: [
        { key: 'same', text: 'First', type: 'rating' },
        { key: 'same', text: 'Second', type: 'rating' },
      ],
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 30000);

  it('freezes the questions once it is open', async () => {
    const ctx = await scaffold();
    const { survey } = await openSurveyFor(ctx);

    const res = await api(ctx.admin.token).patch(`/${survey._id}`, {
      questions: [{ key: 'new', text: 'Different question', type: 'rating' }],
    });

    // Answers are stored against question keys; changing them would leave responses pointing at
    // questions that no longer exist.
    expect(res.status).toBe(400);
  }, 30000);

  it('refuses to open to an audience that matches nobody', async () => {
    const ctx = await scaffold();
    const survey = (await draft(ctx, { audience: { roles: ['Hostel Warden'] } })).body.data;

    const res = await open(ctx, survey._id);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/matches nobody/);
  }, 30000);

  it('will not delete a survey that has gone out', async () => {
    const ctx = await scaffold();
    const { survey } = await openSurveyFor(ctx);

    const res = await api(ctx.admin.token).del(`/${survey._id}`);

    expect(res.status).toBe(400);
  }, 30000);
});

describe('answering', () => {
  it('accepts a complete response', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx);

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, {
      answers: [
        { questionKey: 'q1', value: 4 },
        { questionKey: 'q2', value: true },
        { questionKey: 'q3', value: 'Report discussion' },
        { questionKey: 'q4', value: 'Well organised.' },
      ],
    });

    expect(res.status).toBe(200);
    expect(await SurveyResponse.countDocuments({})).toBe(1);
    expect(await SurveyParticipation.countDocuments({})).toBe(1);
  }, 30000);

  it('names every missing required question at once', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, {
      questions: [
        { key: 'a', text: 'First', type: 'rating', required: true },
        { key: 'b', text: 'Second', type: 'short_text', required: true },
      ],
    });

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [] });

    // Told about all of them, rather than discovering them one submit at a time.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/First/);
    expect(res.body.message).toMatch(/Second/);
  }, 30000);

  it('rejects a rating outside 1 to 5', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx);

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, {
      answers: [{ questionKey: 'q1', value: 9 }],
    });

    expect(res.status).toBe(400);
  }, 30000);

  it('rejects a choice that is not on the list', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx);

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, {
      answers: [{ questionKey: 'q1', value: 5 }, { questionKey: 'q3', value: 'The samosas' }],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not an option/i);
  }, 30000);

  it('rejects an answer to a question that is not on the survey', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx);

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, {
      answers: [{ questionKey: 'q1', value: 5 }, { questionKey: 'ghost', value: 'hello' }],
    });

    // Quietly dropping it would hide that the form and the survey have drifted apart.
    expect(res.status).toBe(400);
  }, 30000);

  it('refuses somebody it was not sent to', async () => {
    const ctx = await scaffold();
    const { survey } = await openSurveyFor(ctx, { audience: { roles: ['Parent'] } });
    const teacher = await mkUser('Teacher', ctx.school._id);

    const res = await api(teacher.token).post(`/${survey._id}/respond`, {
      answers: [{ questionKey: 'q1', value: 5 }],
    });

    expect(res.status).toBe(403);
  }, 30000);

  it('refuses once the survey is closed', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx);
    await api(ctx.admin.token).post(`/${survey._id}/close`, {});

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, {
      answers: [{ questionKey: 'q1', value: 5 }],
    });

    expect(res.status).toBe(400);
  }, 30000);

  it('lets a named response be changed', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { isAnonymous: false });
    await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 2 }] });

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 5 }] });
    const mine = await api(family.parent.token).get(`/${survey._id}/my-response`);

    expect(res.status).toBe(200);
    expect(await SurveyResponse.countDocuments({})).toBe(1);
    expect(mine.body.data.answers[0].value).toBe(5);
  }, 30000);
});

describe('anonymity', () => {
  it('stores no respondent on an anonymous survey', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { isAnonymous: true });

    await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 3 }] });

    const response = await SurveyResponse.findOne({}).lean();
    // The whole guarantee is this: nothing on the answers points back at a person.
    expect(response.respondentId).toBeNull();
  }, 30000);

  it('still knows that they replied, without knowing what they said', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { isAnonymous: true });

    await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 3 }] });
    const participation = await SurveyParticipation.findOne({}).lean();

    // Kept in a separate collection with no answers in it, so the school can chase the people who
    // have not replied without being able to join the two.
    expect(String(participation.userId)).toBe(String(family.parent.user._id));
  }, 30000);

  it('cannot change an anonymous answer, and says why', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { isAnonymous: true });
    await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 3 }] });

    const res = await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 5 }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/anonymous answers cannot be changed/i);
    expect(await SurveyResponse.countDocuments({})).toBe(1);
  }, 30000);

  it('will not hand back individual answers for an anonymous survey', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { isAnonymous: true });
    await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 3 }] });

    const res = await api(ctx.admin.token).get(`/${survey._id}/responses`);

    // Refused outright rather than returned with names stripped — a route that sometimes strips
    // names is one refactor away from not stripping them.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only the summary/i);
  }, 30000);

  it('hands back individual answers for a named survey', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { isAnonymous: false });
    await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 3 }] });

    const res = await api(ctx.admin.token).get(`/${survey._id}/responses`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].respondentId.name).toMatch(/Parent/);
  }, 30000);

  it('tells an anonymous respondent it cannot look their answers up', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { isAnonymous: true });
    await api(family.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 3 }] });

    const res = await api(family.parent.token).get(`/${survey._id}/my-response`);

    expect(res.body.data.hasResponded).toBe(true);
    expect(res.body.data.answers).toBeNull();
  }, 30000);
});

describe('results', () => {
  it('reports an unanswered survey without falling over', async () => {
    const ctx = await scaffold();
    const { survey } = await openSurveyFor(ctx, { audience: { roles: ['Parent'] } });

    const res = await api(ctx.admin.token).get(`/${survey._id}/results`);
    const q1 = res.body.data.questions.find((q) => q.key === 'q1');

    expect(res.body.data.responded).toBe(0);
    expect(res.body.data.responseRate).toBe(0);
    expect(q1.average).toBeNull();
  }, 30000);

  it('counts response rate against who it was sent to', async () => {
    const ctx = await scaffold();
    const a = await addFamily(ctx);
    await addFamily(ctx);
    const survey = (await draft(ctx, { audience: { roles: ['Parent'] } })).body.data;
    await open(ctx, survey._id);
    await api(a.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 4 }] });

    const res = await api(ctx.admin.token).get(`/${survey._id}/results`);

    expect(res.body.data.sentTo).toBe(2);
    expect(res.body.data.responded).toBe(1);
    expect(res.body.data.responseRate).toBe(50);
  }, 30000);

  it('averages the ratings that came back', async () => {
    const ctx = await scaffold();
    const a = await addFamily(ctx);
    const b = await addFamily(ctx);
    const survey = (await draft(ctx, { audience: { roles: ['Parent'] } })).body.data;
    await open(ctx, survey._id);
    await api(a.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 5 }] });
    await api(b.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 2 }] });

    const res = await api(ctx.admin.token).get(`/${survey._id}/results`);
    const q1 = res.body.data.questions.find((q) => q.key === 'q1');

    expect(q1.average).toBe(3.5);
    expect(q1.min).toBe(2);
    expect(q1.max).toBe(5);
    expect(q1.distribution).toEqual({ 2: 1, 5: 1 });
  }, 30000);

  it('lists free text rather than trying to count it', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx, { audience: { roles: ['Parent'] } });
    await api(family.parent.token).post(`/${survey._id}/respond`, {
      answers: [{ questionKey: 'q1', value: 4 }, { questionKey: 'q4', value: 'More time with the class teacher.' }],
    });

    const res = await api(ctx.admin.token).get(`/${survey._id}/results`);
    const q4 = res.body.data.questions.find((q) => q.key === 'q4');

    // The comments are usually the reason the survey was run.
    expect(q4.texts).toContain('More time with the class teacher.');
  }, 30000);

  it('lists who has not replied', async () => {
    const ctx = await scaffold();
    const a = await addFamily(ctx);
    const b = await addFamily(ctx);
    const survey = (await draft(ctx, { audience: { roles: ['Parent'] } })).body.data;
    await open(ctx, survey._id);
    await api(a.parent.token).post(`/${survey._id}/respond`, { answers: [{ questionKey: 'q1', value: 4 }] });

    const res = await api(ctx.admin.token).get(`/${survey._id}/pending`);

    expect(res.body.data).toHaveLength(1);
    expect(String(res.body.data[0].userId)).toBe(String(b.parent.user._id));
  }, 30000);
});

describe('who can do what', () => {
  it('shows a parent only the surveys sent to them', async () => {
    const ctx = await scaffold();
    const { family } = await openSurveyFor(ctx, { audience: { roles: ['Parent'] } });

    const res = await api(family.parent.token).get('/mine');

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].hasResponded).toBe(false);
  }, 30000);

  it('keeps a parent out of the results', async () => {
    const ctx = await scaffold();
    const { family, survey } = await openSurveyFor(ctx);

    const res = await api(family.parent.token).get(`/${survey._id}/results`);

    expect(res.status).toBe(403);
  }, 30000);

  it('does not show one school the surveys of another', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    await openSurveyFor(theirs);

    const res = await api(mine.admin.token).get('');

    expect(res.body.data).toHaveLength(0);
  }, 30000);
});
