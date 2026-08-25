import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';
import { Role } from '../../src/models/Roles.model.js';
import { initializeNewSchool } from '../../src/utils/schoolSetup.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe('initializeNewSchool (default per-school role seeding)', () => {
  it('creates School Admin/Teacher/Student/Parent roles with real module permissions, instead of crashing on the old undefined SubjectMaster reference', async () => {
    const school = await createSchool();

    await initializeNewSchool(school._id);

    const roles = await Role.find({ schoolId: school._id }).lean();
    expect(roles.map((r) => r.name).sort()).toEqual(['Parent', 'School Admin', 'Student', 'Teacher']);

    const schoolAdminRole = roles.find((r) => r.name === 'School Admin');
    expect(schoolAdminRole.permissions.some((p) => p.module === 'Students' && p.actions.includes('create'))).toBe(true);
  }, 15000);

  it('is idempotent — calling it twice for the same school does not duplicate roles or throw', async () => {
    const school = await createSchool();

    await initializeNewSchool(school._id);
    await initializeNewSchool(school._id);

    const roles = await Role.find({ schoolId: school._id }).lean();
    expect(roles).toHaveLength(4);
  });
});

describe('POST /school/register', () => {
  it('provisions the new school with its default roles as part of registration', async () => {
    const platformSchool = await createSchool();
    const superAdminRole = await createRole('Super Admin');
    const { user } = await createUser({
      name: 'Owner',
      email: 'owner-register@platform.test',
      roleId: superAdminRole._id,
      schoolId: platformSchool._id,
    });
    const token = await loginAs(user.email);

    const response = await request(app)
      .post('/api/v1/school/register')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'New School')
      .field('email', 'newschool@test.example');

    expect(response.status).toBe(201);

    const roles = await Role.find({ schoolId: response.body.data._id }).lean();
    expect(roles.map((r) => r.name).sort()).toEqual(['Parent', 'School Admin', 'Student', 'Teacher']);
  }, 15000);
});
