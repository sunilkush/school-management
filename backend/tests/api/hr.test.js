import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createEmployee, loginAs } from '../helpers/fixtures.js';
import { Role } from '../../src/models/Roles.model.js';
import { JobPosting } from '../../src/models/JobPosting.model.js';
import { JobApplication } from '../../src/models/JobApplication.model.js';
import { AppraisalReview } from '../../src/models/AppraisalReview.model.js';

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
    name: roleName, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@hr.test`,
    roleId: role._id, schoolId,
  });
  return { user, token: await loginAs(user.email) };
};

const scaffold = async () => {
  const school = await createSchool();
  const admin = await mkUser('School Admin', school._id);
  return { school, admin };
};

/** A member of staff with both a login and an Employee record. */
const addStaff = async (ctx, roleName = 'Teacher') => {
  const account = await mkUser(roleName, ctx.school._id);
  const employee = await createEmployee({ userId: account.user._id, schoolId: ctx.school._id });
  return { ...account, employee };
};

const api = (token) => ({
  get: (p) => request(app).get(`/api/v1/hr${p}`).set('Authorization', `Bearer ${token}`),
  post: (p, b) => request(app).post(`/api/v1/hr${p}`).set('Authorization', `Bearer ${token}`).send(b),
  patch: (p, b) => request(app).patch(`/api/v1/hr${p}`).set('Authorization', `Bearer ${token}`).send(b),
  del: (p) => request(app).delete(`/api/v1/hr${p}`).set('Authorization', `Bearer ${token}`),
});

const makePosting = (ctx, body = {}) =>
  api(ctx.admin.token).post('/postings', { title: 'PGT Mathematics', openings: 1, ...body });

const makeApplication = (ctx, postingId, body = {}) =>
  api(ctx.admin.token).post('/applications', {
    jobPostingId: postingId, candidateName: 'Asha Verma', email: 'asha@example.com', ...body,
  });

/* ══ Recruitment ══════════════════════════════════════════════════ */

describe('job postings', () => {
  it('creates a posting as a draft', async () => {
    const ctx = await scaffold();

    const res = await makePosting(ctx);

    expect(res.status).toBe(201);
    // A draft, so a half-written vacancy is not live the moment it is saved.
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.postedAt).toBeNull();
  }, 30000);

  it('stamps the posted date when it is opened', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx)).body.data;

    const res = await api(ctx.admin.token).patch(`/postings/${posting._id}`, { status: 'open' });

    expect(res.body.data.postedAt).toEqual(expect.any(String));
  }, 30000);

  it('refuses a salary band that runs backwards', async () => {
    const ctx = await scaffold();

    const res = await makePosting(ctx, { salaryMin: 60000, salaryMax: 40000 });

    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 30000);

  it('will not delete a posting people have applied to', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx)).body.data;
    await makeApplication(ctx, posting._id);

    const res = await api(ctx.admin.token).del(`/postings/${posting._id}`);

    // The applications record people the school dealt with, including the ones it turned down.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Close the posting instead/);
  }, 30000);

  it('counts applicants alongside each posting', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx)).body.data;
    await makeApplication(ctx, posting._id);
    await makeApplication(ctx, posting._id, { candidateName: 'Ravi', email: 'ravi@example.com' });

    const res = await api(ctx.admin.token).get('/postings');

    expect(res.body.data[0].applicants.total).toBe(2);
    expect(res.body.data[0].applicants.active).toBe(2);
  }, 30000);

  it('does not show one school the postings of another', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    await makePosting(theirs);

    const res = await api(mine.admin.token).get('/postings');

    expect(res.body.data).toHaveLength(0);
  }, 30000);
});

describe('applications', () => {
  it('refuses the same candidate twice for one post', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx)).body.data;
    await makeApplication(ctx, posting._id);

    const res = await makeApplication(ctx, posting._id);

    // Two applications would give the same person two stages and two decisions.
    expect(res.status).toBe(409);
  }, 30000);

  it('records who moved a candidate and why', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx)).body.data;
    const application = (await makeApplication(ctx, posting._id)).body.data;

    const res = await api(ctx.admin.token)
      .patch(`/applications/${application._id}/stage`, { stage: 'shortlisted', note: 'Strong subject knowledge' });

    expect(res.body.data.stage).toBe('shortlisted');
    expect(res.body.data.history).toHaveLength(2);
    expect(res.body.data.history[1].note).toBe('Strong subject knowledge');
  }, 30000);

  it('will not move a rejected candidate without reopening them first', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx)).body.data;
    const application = (await makeApplication(ctx, posting._id)).body.data;
    await api(ctx.admin.token).patch(`/applications/${application._id}/stage`, { stage: 'rejected', note: 'Not enough experience' });

    const res = await api(ctx.admin.token).patch(`/applications/${application._id}/stage`, { stage: 'interview' });

    // Reopening somebody is a deliberate act, not a side effect of clicking through a list.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reopen/i);
  }, 30000);

  it('lets a rejected candidate be reopened deliberately', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx)).body.data;
    const application = (await makeApplication(ctx, posting._id)).body.data;
    await api(ctx.admin.token).patch(`/applications/${application._id}/stage`, { stage: 'rejected' });

    const res = await api(ctx.admin.token).patch(`/applications/${application._id}/reopen`, { note: 'Post reopened' });

    expect(res.body.data.stage).toBe('shortlisted');
  }, 30000);

  it('closes the posting once the last opening is filled', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx, { openings: 1 })).body.data;
    await api(ctx.admin.token).patch(`/postings/${posting._id}`, { status: 'open' });
    const application = (await makeApplication(ctx, posting._id)).body.data;

    await api(ctx.admin.token).patch(`/applications/${application._id}/stage`, { stage: 'hired' });

    // Otherwise it sits open and the school keeps getting applications for a filled job.
    const after = await JobPosting.findById(posting._id).lean();
    expect(after.status).toBe('filled');
  }, 30000);

  it('leaves a posting open while openings remain', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx, { openings: 2 })).body.data;
    await api(ctx.admin.token).patch(`/postings/${posting._id}`, { status: 'open' });
    const application = (await makeApplication(ctx, posting._id)).body.data;

    await api(ctx.admin.token).patch(`/applications/${application._id}/stage`, { stage: 'hired' });

    const after = await JobPosting.findById(posting._id).lean();
    expect(after.status).toBe('open');
  }, 30000);

  it('reports the pipeline by stage, not as one number', async () => {
    const ctx = await scaffold();
    const posting = (await makePosting(ctx, { openings: 2 })).body.data;
    await api(ctx.admin.token).patch(`/postings/${posting._id}`, { status: 'open' });
    const a = (await makeApplication(ctx, posting._id)).body.data;
    const b = (await makeApplication(ctx, posting._id, { candidateName: 'Ravi', email: 'ravi@example.com' })).body.data;
    await api(ctx.admin.token).patch(`/applications/${a._id}/stage`, { stage: 'interview' });
    await api(ctx.admin.token).patch(`/applications/${b._id}/stage`, { stage: 'rejected' });

    const res = await api(ctx.admin.token).get('/postings/pipeline');

    expect(res.body.data.byStage.interview).toBe(1);
    expect(res.body.data.byStage.rejected).toBe(1);
    // A rejected candidate is not someone still in the running.
    expect(res.body.data.active).toBe(1);
    expect(res.body.data.stillToFill).toBe(2);
  }, 30000);

  it('cannot reach an application in another school', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    const posting = (await makePosting(theirs)).body.data;
    const application = (await makeApplication(theirs, posting._id)).body.data;

    const res = await api(mine.admin.token).patch(`/applications/${application._id}/stage`, { stage: 'shortlisted' });

    expect(res.status).toBe(404);
  }, 30000);
});

/* ══ Appraisals ═══════════════════════════════════════════════════ */

const CRITERIA = [
  { name: 'Teaching quality', weight: 50 },
  { name: 'Punctuality', weight: 20 },
  { name: 'Student outcomes', weight: 30 },
];

const makeCycle = (ctx, body = {}) =>
  api(ctx.admin.token).post('/appraisal/cycles', {
    name: 'Annual Review 2025-26',
    periodStart: '2025-06-01',
    periodEnd: '2026-03-31',
    criteria: CRITERIA,
    ...body,
  });

describe('appraisal cycles', () => {
  it('creates a cycle as a draft', async () => {
    const ctx = await scaffold();

    const res = await makeCycle(ctx);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
  }, 30000);

  it('refuses to open a cycle whose weights do not add up to 100', async () => {
    const ctx = await scaffold();
    const cycle = (await makeCycle(ctx, { criteria: [{ name: 'Teaching', weight: 40 }] })).body.data;

    const res = await api(ctx.admin.token).patch(`/appraisal/cycles/${cycle._id}`, { status: 'open' });

    // Scores from unbalanced weights cannot be compared between staff, which is the point of a round.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toMatch(/add up to 100/);
  }, 30000);

  it('refuses a period that ends before it starts', async () => {
    const ctx = await scaffold();

    const res = await makeCycle(ctx, { periodStart: '2026-03-31', periodEnd: '2025-06-01' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 30000);

  it('opens a review for every employee', async () => {
    const ctx = await scaffold();
    await addStaff(ctx);
    await addStaff(ctx);
    const cycle = (await makeCycle(ctx)).body.data;

    const res = await api(ctx.admin.token).post(`/appraisal/cycles/${cycle._id}/start`, {});

    expect(res.body.data.created).toBe(2);
    expect(await AppraisalReview.countDocuments({ cycleId: cycle._id })).toBe(2);
  }, 30000);

  it('does not open a second review for anyone when started again', async () => {
    const ctx = await scaffold();
    await addStaff(ctx);
    const cycle = (await makeCycle(ctx)).body.data;
    await api(ctx.admin.token).post(`/appraisal/cycles/${cycle._id}/start`, {});

    const again = await api(ctx.admin.token).post(`/appraisal/cycles/${cycle._id}/start`, {});

    expect(again.body.data.created).toBe(0);
    expect(await AppraisalReview.countDocuments({ cycleId: cycle._id })).toBe(1);
  }, 30000);

  it('will not let criteria change once the cycle is open', async () => {
    const ctx = await scaffold();
    await addStaff(ctx);
    const cycle = (await makeCycle(ctx)).body.data;
    await api(ctx.admin.token).post(`/appraisal/cycles/${cycle._id}/start`, {});

    const res = await api(ctx.admin.token)
      .patch(`/appraisal/cycles/${cycle._id}`, { criteria: [{ name: 'Something else', weight: 100 }] });

    // Otherwise two people in the same round would be scored on different things.
    expect(res.status).toBe(400);
  }, 30000);
});

describe('reviews', () => {
  const openCycleWithStaff = async () => {
    const ctx = await scaffold();
    const staff = await addStaff(ctx);
    const head = await mkUser('Vice Principal', ctx.school._id);
    const cycle = (await makeCycle(ctx)).body.data;
    await api(ctx.admin.token).post(`/appraisal/cycles/${cycle._id}/start`, {});
    const review = await AppraisalReview.findOne({ cycleId: cycle._id, employeeId: staff.employee._id }).lean();
    return { ctx, staff, head, cycle, review };
  };

  it('lets a member of staff score themselves', async () => {
    const { staff, review } = await openCycleWithStaff();

    const res = await api(staff.token).patch(`/appraisal/reviews/${review._id}/self`, {
      scores: [{ criterion: 'Teaching quality', score: 4 }],
      comment: 'A good year.',
    });

    expect(res.body.data.status).toBe('self_submitted');
  }, 30000);

  it('will not let somebody fill in another person self-assessment', async () => {
    const { head, review } = await openCycleWithStaff();

    const res = await api(head.token).patch(`/appraisal/reviews/${review._id}/self`, {
      scores: [{ criterion: 'Teaching quality', score: 5 }],
    });

    // The gap between self and reviewer scores is the useful part; it means nothing if anyone can
    // write the self side.
    expect(res.status).toBe(403);
  }, 30000);

  it('works the overall score out from the criteria weights', async () => {
    const { head, review } = await openCycleWithStaff();

    const res = await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [
        { criterion: 'Teaching quality', score: 5 },
        { criterion: 'Punctuality', score: 3 },
        { criterion: 'Student outcomes', score: 4 },
      ],
    });

    // (5*50 + 3*20 + 4*30) / 100 = 4.3
    expect(res.body.data.overallScore).toBe(4.3);
    expect(res.body.data.overallBand).toBe('Exceeds expectations');
  }, 30000);

  it('averages only the criteria actually scored', async () => {
    const { head, review } = await openCycleWithStaff();

    const res = await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Teaching quality', score: 4 }],
    });

    // Dividing by the full 100 would mark the employee down for the reviewer's omission.
    expect(res.body.data.overallScore).toBe(4);
  }, 30000);

  it('rejects a score against a criterion the cycle does not have', async () => {
    const { head, review } = await openCycleWithStaff();

    const res = await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Made good tea', score: 5 }],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Not a criterion/);
  }, 30000);

  it('will not let anyone review themselves', async () => {
    const { staff, review } = await openCycleWithStaff();

    const res = await api(staff.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Teaching quality', score: 5 }],
    });

    expect(res.status).toBe(403);
  }, 30000);

  it('surfaces where the two sides disagree most', async () => {
    const { staff, head, review } = await openCycleWithStaff();
    await api(staff.token).patch(`/appraisal/reviews/${review._id}/self`, {
      scores: [
        { criterion: 'Teaching quality', score: 5 },
        { criterion: 'Punctuality', score: 5 },
      ],
    });

    const res = await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [
        { criterion: 'Teaching quality', score: 4 },
        { criterion: 'Punctuality', score: 2 },
      ],
    });

    // Biggest disagreement first — that is the conversation to have.
    expect(res.body.data.gaps[0].criterion).toBe('Punctuality');
    expect(res.body.data.gaps[0].gap).toBe(3);
  }, 30000);

  it('freezes a finalised appraisal', async () => {
    const { head, review } = await openCycleWithStaff();
    await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Teaching quality', score: 4 }],
      finalise: true,
    });

    const again = await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Teaching quality', score: 2 }],
    });

    // The number has been shown to the member of staff and may already have been acted on.
    expect(again.status).toBe(400);
  }, 30000);

  it('hides the reviewer scores from staff until it is finalised', async () => {
    const { staff, head, review } = await openCycleWithStaff();
    await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Teaching quality', score: 2 }],
      comment: 'Needs work on classroom control.',
    });

    const beforeFinal = await api(staff.token).get('/appraisal/reviews/mine');
    await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Teaching quality', score: 2 }],
      finalise: true,
    });
    const afterFinal = await api(staff.token).get('/appraisal/reviews/mine');

    // A half-filled reviewer form read over somebody's shoulder is worse than no form at all.
    expect(beforeFinal.body.data.reviewerScores).toHaveLength(0);
    expect(beforeFinal.body.data.reviewerComment).toBe('');
    expect(afterFinal.body.data.reviewerScores).toHaveLength(1);
    expect(afterFinal.body.data.reviewerComment).toMatch(/classroom control/);
  }, 30000);

  it('reports how far through the cycle the school is', async () => {
    const { ctx, head, cycle, review } = await openCycleWithStaff();
    await api(head.token).patch(`/appraisal/reviews/${review._id}/review`, {
      scores: [{ criterion: 'Teaching quality', score: 4 }],
      finalise: true,
    });

    const res = await api(ctx.admin.token).get('/appraisal/cycles');
    const found = res.body.data.find((c) => c._id === String(cycle._id));

    expect(found.progress.finalised).toBe(1);
    expect(found.progress.averageScore).toBe(4);
  }, 30000);

  it('keeps a teacher out of other people reviews', async () => {
    const { staff } = await openCycleWithStaff();

    const res = await api(staff.token).get('/appraisal/reviews');

    expect(res.status).toBe(403);
  }, 30000);
});
