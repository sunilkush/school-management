import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createActiveAcademicYear, loginAs } from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('GET /student/school', () => {
  it('allows Hostel Warden (needed by the Rooms/Allocations page to list students for room assignment)', async () => {
    const school = await createSchool();
    await createActiveAcademicYear({ schoolId: school._id });
    const wardenRole = await createRole('Hostel Warden');
    const { user } = await createUser({ name: 'Warden', email: 'warden@school.test', roleId: wardenRole._id, schoolId: school._id });
    const token = await loginAs(user.email);

    const response = await request(app)
      .get('/api/v1/student/school')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).not.toBe(403);
  });
});
