import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('PUT /school/activate/:schoolId', () => {
  it('actually activates the school instead of 404ing (route param must match req.params.schoolId)', async () => {
    const school = await createSchool({ isActive: false });
    const superAdminRole = await createRole('Super Admin');
    const { user } = await createUser({ name: 'Owner', email: 'owner@platform.test', roleId: superAdminRole._id, schoolId: school._id });
    const token = await loginAs(user.email);

    const response = await request(app)
      .put(`/api/v1/school/activate/${school._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isActive).toBe(true);
  });
});
