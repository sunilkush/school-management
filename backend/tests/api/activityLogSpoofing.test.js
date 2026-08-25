import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';
import ActivityLog from '../../src/models/ActivityLog.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('POST /activity-logs', () => {
  it('attributes the log to the authenticated caller, ignoring a spoofed user/role/school in the body', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const studentRole = await createRole('Student', { schoolId: school._id });
    const { user: student } = await createUser({
      name: 'Low Priv Student',
      email: 'student@school.test',
      roleId: studentRole._id,
      schoolId: school._id,
    });
    const token = await loginAs(student.email);

    const response = await request(app)
      .post('/api/v1/activity-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'DELETE',
        description: 'Deleted all student records',
        user: '65f000000000000000000001',
        role: '65f000000000000000000002',
        school: otherSchool._id.toString(),
        ipAddress: '1.2.3.4',
        userAgent: 'forged-agent',
      });

    expect(response.status).toBe(201);

    const log = await ActivityLog.findById(response.body.data._id).lean();
    expect(log.user.toString()).toBe(student._id.toString());
    expect(log.school.toString()).toBe(school._id.toString());
    expect(log.school.toString()).not.toBe(otherSchool._id.toString());
  }, 15000);
});
