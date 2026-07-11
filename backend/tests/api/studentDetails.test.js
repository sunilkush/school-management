import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createStudent, loginAs } from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('GET /student/getStudent/:id', () => {
  it("gives a Student their own profile regardless of what :id is passed (ignores the param, same as before the fix)", async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const { user } = await createUser({ name: 'Asha', email: 'asha@school.test', roleId: studentRole._id, schoolId: school._id });
    await createStudent({ userId: user._id, schoolId: school._id });
    const token = await loginAs(user.email);

    const response = await request(app)
      .get('/api/v1/student/getStudent/000000000000000000000000') // deliberately wrong/unrelated id
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.userId._id.toString()).toBe(user._id.toString());
  });

  it('lets a Teacher fetch a specific student by id within their own school', async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const teacherRole = await createRole('Teacher');
    const { user: studentUser } = await createUser({ name: 'Ravi', email: 'ravi@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id });
    const { user: teacherUser } = await createUser({ name: 'A Teacher', email: 'teacher@school.test', roleId: teacherRole._id, schoolId: school._id });
    const token = await loginAs(teacherUser.email);

    const response = await request(app)
      .get(`/api/v1/student/getStudent/${student._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data._id.toString()).toBe(student._id.toString());
  });

  it('blocks a Teacher from fetching a student in a different school', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const studentRole = await createRole('Student');
    const teacherRole = await createRole('Teacher');
    const { user: studentUser } = await createUser({ name: 'Ravi', email: 'ravi@school.test', roleId: studentRole._id, schoolId: schoolB._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: schoolB._id });
    const { user: teacherUser } = await createUser({ name: 'A Teacher', email: 'teacher@school.test', roleId: teacherRole._id, schoolId: schoolA._id });
    const token = await loginAs(teacherUser.email);

    const response = await request(app)
      .get(`/api/v1/student/getStudent/${student._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('lets a Parent fetch their own linked child by id', async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const parentRole = await createRole('Parent');
    const { user: studentUser } = await createUser({ name: 'Child', email: 'child@school.test', roleId: studentRole._id, schoolId: school._id });
    const { user: parentUser } = await createUser({ name: 'Parent', email: 'parent@school.test', roleId: parentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id, fatherId: parentUser._id });
    const token = await loginAs(parentUser.email);

    const response = await request(app)
      .get(`/api/v1/student/getStudent/${student._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data._id.toString()).toBe(student._id.toString());
  });

  it("blocks a Parent from fetching a student who isn't their child", async () => {
    const school = await createSchool();
    const studentRole = await createRole('Student');
    const parentRole = await createRole('Parent');
    const { user: studentUser } = await createUser({ name: 'Someone Else', email: 'other@school.test', roleId: studentRole._id, schoolId: school._id });
    const student = await createStudent({ userId: studentUser._id, schoolId: school._id }); // no fatherId/motherId set
    const { user: parentUser } = await createUser({ name: 'Unrelated Parent', email: 'parent@school.test', roleId: parentRole._id, schoolId: school._id });
    const token = await loginAs(parentUser.email);

    const response = await request(app)
      .get(`/api/v1/student/getStudent/${student._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
