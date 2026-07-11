import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createStudent, createActiveAcademicYear, createEnrollment, loginAs } from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('GET /user/all', () => {
  it('projects phone alongside name/email/role/school (staff directory)', async () => {
    const school = await createSchool();
    const teacherRole = await createRole('Teacher');
    const adminRole = await createRole('School Admin');

    await createUser({ name: 'Kavya', email: 'kavya@school.test', phone: '9998887777', roleId: teacherRole._id, schoolId: school._id });
    const { user: adminUser } = await createUser({ name: 'Admin', email: 'admin@school.test', roleId: adminRole._id, schoolId: school._id });
    const token = await loginAs(adminUser.email);

    const response = await request(app)
      .get('/api/v1/user/all')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const row = response.body.data.find((u) => u.email === 'kavya@school.test');
    expect(row).toBeDefined();
    expect(row.phone).toBe('9998887777');
    expect(row.role.name).toBe('Teacher');
  });

  it('roleName=Parent + academicYearId only returns parents actually linked to a student enrolled that year', async () => {
    const school = await createSchool();
    const academicYear = await createActiveAcademicYear({ schoolId: school._id });
    const studentRole = await createRole('Student');
    const parentRole = await createRole('Parent');
    const adminRole = await createRole('School Admin');

    const { user: linkedParent } = await createUser({ name: 'Linked Parent', email: 'linkedparent@school.test', roleId: parentRole._id, schoolId: school._id });
    const { user: unlinkedParent } = await createUser({ name: 'Unlinked Parent', email: 'unlinkedparent@school.test', roleId: parentRole._id, schoolId: school._id });

    const { user: studentUser } = await createUser({ name: 'Child', email: 'child@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id, fatherId: linkedParent._id });
    await createEnrollment({ studentId: student._id, schoolId: school._id, academicYearId: academicYear._id });

    const { user: adminUser } = await createUser({ name: 'Admin', email: 'admin@school.test', roleId: adminRole._id, schoolId: school._id });
    const token = await loginAs(adminUser.email);

    const response = await request(app)
      .get('/api/v1/user/all')
      .query({ roleName: 'Parent', academicYearId: academicYear._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const emails = response.body.data.map((u) => u.email);
    expect(emails).toContain('linkedparent@school.test');
    expect(emails).not.toContain('unlinkedparent@school.test');
  });

  it('a deactivated user disappears from the default list but is findable with isActive=false, so it can be reactivated', async () => {
    const school = await createSchool();
    const teacherRole = await createRole('Teacher');
    const adminRole = await createRole('School Admin');

    const { user: teacherUser } = await createUser({ name: 'Rohan', email: 'rohan@school.test', roleId: teacherRole._id, schoolId: school._id });
    const { user: adminUser } = await createUser({ name: 'Admin', email: 'admin@school.test', roleId: adminRole._id, schoolId: school._id });
    const token = await loginAs(adminUser.email);

    await request(app)
      .patch(`/api/v1/user/delete/${teacherUser._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeOnly = await request(app)
      .get('/api/v1/user/all')
      .set('Authorization', `Bearer ${token}`);
    expect(activeOnly.body.data.map((u) => u.email)).not.toContain('rohan@school.test');

    const inactiveOnly = await request(app)
      .get('/api/v1/user/all')
      .query({ isActive: 'false' })
      .set('Authorization', `Bearer ${token}`);
    expect(inactiveOnly.body.data.map((u) => u.email)).toContain('rohan@school.test');
  });
});
