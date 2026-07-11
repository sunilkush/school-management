import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';
import { DeviceToken } from '../../src/models/DeviceToken.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

async function setUpAuthenticatedUser() {
  const school = await createSchool();
  const role = await createRole('Teacher');
  const { user } = await createUser({ name: 'A Teacher', email: 'teacher@school.test', roleId: role._id, schoolId: school._id });
  const token = await loginAs(user.email);
  return { user, token };
}

describe('POST /device-tokens/register', () => {
  it('rejects an unauthenticated request', async () => {
    const response = await request(app).post('/api/v1/device-tokens/register').send({ token: 'abc', platform: 'android' });
    expect(response.status).toBe(401);
  });

  it('creates a device token record for the signed-in user', async () => {
    const { user, token } = await setUpAuthenticatedUser();

    const response = await request(app)
      .post('/api/v1/device-tokens/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'fcm-token-abc', platform: 'android' });

    expect(response.status).toBe(201);
    const stored = await DeviceToken.findOne({ token: 'fcm-token-abc' });
    expect(stored).not.toBeNull();
    expect(stored.userId.toString()).toBe(user._id.toString());
    expect(stored.isActive).toBe(true);
  });

  it('rejects a platform value outside android/ios', async () => {
    const { token } = await setUpAuthenticatedUser();

    const response = await request(app)
      .post('/api/v1/device-tokens/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'fcm-token-abc', platform: 'windows-phone' });

    expect(response.status).toBe(400);
  });

  it('re-points an existing token at a new user instead of creating a duplicate row (shared/reset device case)', async () => {
    const { token: tokenA } = await setUpAuthenticatedUser();
    const school = await createSchool();
    const role = await createRole('Teacher', { schoolId: school._id });
    const { user: userB } = await createUser({ name: 'Teacher B', email: 'teacherb@school.test', roleId: role._id, schoolId: school._id });
    const tokenB = await loginAs(userB.email);

    await request(app).post('/api/v1/device-tokens/register').set('Authorization', `Bearer ${tokenA}`).send({ token: 'shared-device', platform: 'ios' });
    await request(app).post('/api/v1/device-tokens/register').set('Authorization', `Bearer ${tokenB}`).send({ token: 'shared-device', platform: 'ios' });

    const rows = await DeviceToken.find({ token: 'shared-device' });
    expect(rows).toHaveLength(1);
    expect(rows[0].userId.toString()).toBe(userB._id.toString());
  });
});

describe('POST /device-tokens/unregister', () => {
  it('deactivates the token so it stops receiving push, without deleting the audit row', async () => {
    const { token } = await setUpAuthenticatedUser();
    await request(app).post('/api/v1/device-tokens/register').set('Authorization', `Bearer ${token}`).send({ token: 'to-remove', platform: 'android' });

    const response = await request(app).post('/api/v1/device-tokens/unregister').set('Authorization', `Bearer ${token}`).send({ token: 'to-remove' });

    expect(response.status).toBe(200);
    const stored = await DeviceToken.findOne({ token: 'to-remove' });
    expect(stored.isActive).toBe(false);
  });
});
