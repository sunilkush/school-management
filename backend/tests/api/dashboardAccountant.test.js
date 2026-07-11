import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

// getDashboardSummary looks up Teacher/Student/School Admin roles unconditionally (regardless of
// which branch the caller's own role takes) and 400s if any are missing — so every test needs all
// three present even though this suite only exercises the Accountant branch.
async function seedRolePrerequisites() {
  await createRole('Teacher');
  await createRole('Student');
  await createRole('School Admin');
}

describe('GET /dashboard/summary — Accountant branch', () => {
  it('returns real figures instead of the generic "not available" fallback', async () => {
    await seedRolePrerequisites();
    const school = await createSchool();
    const role = await createRole('Accountant');
    const { user } = await createUser({ name: 'An Accountant', email: 'accountant@school.test', roleId: role._id, schoolId: school._id });
    const token = await loginAs(user.email);

    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .query({ schoolId: school._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    // Before the Phase 5 fix this branch didn't exist and the response was just
    // { message: "Dashboard not available for this role" } — assert the real shape instead.
    expect(response.body.data).toEqual(
      expect.objectContaining({
        monthCollection: expect.any(Number),
        pendingDues: expect.any(Number),
        successfulTransactions: expect.any(Number),
      })
    );
    expect(response.body.data.message).toBeUndefined();
  });

  it('rejects a role the route middleware does not allow through at all', async () => {
    await seedRolePrerequisites();
    const school = await createSchool();
    const role = await createRole('Librarian');
    const { user } = await createUser({ name: 'A Librarian', email: 'librarian@school.test', roleId: role._id, schoolId: school._id });
    const token = await loginAs(user.email);

    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .query({ schoolId: school._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
