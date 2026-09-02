import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool } from '../helpers/fixtures.js';
import { AdmissionInquiry } from '../../src/models/AdmissionInquiry.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const applicant = (schoolId, overrides = {}) => ({
  schoolId: schoolId.toString(),
  studentName: 'Aarav Sharma',
  applyingClass: 'Class 6',
  parentName: 'Meera Sharma',
  parentPhone: '9876543210',
  parentEmail: 'meera@example.test',
  ...overrides,
});

describe('public admission portal — reachability', () => {
  it('serves the school directory with no auth token at all', async () => {
    await createSchool({ name: 'Open School' });

    const res = await request(app).get('/api/v1/public/admissions/schools');

    expect(res.status).toBe(200);
    expect(res.body.data.map((s) => s.name)).toContain('Open School');
  });

  it('omits schools that have closed online admissions, and ones that are inactive', async () => {
    await createSchool({ name: 'Accepting School' });
    await createSchool({ name: 'Closed Intake School', admissionsOpen: false });
    await createSchool({ name: 'Inactive School', isActive: false, status: 'inactive' });

    const res = await request(app).get('/api/v1/public/admissions/schools');
    const names = res.body.data.map((s) => s.name);

    expect(names).toContain('Accepting School');
    expect(names).not.toContain('Closed Intake School');
    expect(names).not.toContain('Inactive School');
  });
});

describe('POST /public/admissions/apply', () => {
  it('accepts an application and files it into the staff inquiry pipeline', async () => {
    const school = await createSchool();

    const res = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id));

    expect(res.status).toBe(201);
    expect(res.body.data.applicationNumber).toMatch(/^ADM-\d{4}-[A-Z0-9]{6}$/);

    // Same collection the existing Admission Inquiry screen reads.
    const stored = await AdmissionInquiry.findOne({ schoolId: school._id });
    expect(stored.source).toBe('website');
    expect(stored.status).toBe('new');
    expect(stored.submittedAt).toBeTruthy();
    expect(stored.studentName).toBe('Aarav Sharma');
  });

  it('refuses an application to a school that has closed online admissions', async () => {
    const school = await createSchool({ admissionsOpen: false });

    const res = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id));

    expect(res.status).toBe(404);
    expect(await AdmissionInquiry.countDocuments({})).toBe(0);
  });

  it('refuses an application to an inactive school', async () => {
    const school = await createSchool({ isActive: false, status: 'inactive' });

    const res = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id));

    expect(res.status).toBe(404);
    expect(await AdmissionInquiry.countDocuments({})).toBe(0);
  });

  it('validates required fields and phone format', async () => {
    const school = await createSchool();

    const missingName = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id, { studentName: '   ' }));
    expect(missingName.status).toBe(400);

    const badPhone = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id, { parentPhone: 'not-a-phone' }));
    expect(badPhone.status).toBe(400);

    expect(await AdmissionInquiry.countDocuments({})).toBe(0);
  });

  it('returns the existing application instead of creating a duplicate on re-submit', async () => {
    const school = await createSchool();

    const first = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id));
    const second = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id));

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.applicationNumber).toBe(first.body.data.applicationNumber);
    expect(await AdmissionInquiry.countDocuments({})).toBe(1);
  });
});

describe('GET /public/admissions/track', () => {
  const submit = async () => {
    const school = await createSchool();
    const res = await request(app)
      .post('/api/v1/public/admissions/apply')
      .send(applicant(school._id));
    return { school, applicationNumber: res.body.data.applicationNumber };
  };

  it('returns the status when the reference and registered phone both match', async () => {
    const { applicationNumber } = await submit();

    const res = await request(app)
      .get('/api/v1/public/admissions/track')
      .query({ applicationNumber, phone: '9876543210' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('new');
    expect(res.body.data.studentName).toBe('Aarav Sharma');
  });

  it('refuses a correct reference paired with the wrong phone, so applicants cannot be enumerated', async () => {
    const { applicationNumber } = await submit();

    const res = await request(app)
      .get('/api/v1/public/admissions/track')
      .query({ applicationNumber, phone: '9999999999' });

    expect(res.status).toBe(404);
    // Same wording as an unknown reference — a wrong phone must not confirm the reference exists.
    expect(res.body.message).toMatch(/No application found/i);
  });

  it('requires both parts of the lookup', async () => {
    const { applicationNumber } = await submit();

    const noPhone = await request(app)
      .get('/api/v1/public/admissions/track')
      .query({ applicationNumber });
    expect(noPhone.status).toBe(400);

    const noRef = await request(app)
      .get('/api/v1/public/admissions/track')
      .query({ phone: '9876543210' });
    expect(noRef.status).toBe(400);
  });

  it('never exposes internal pipeline fields to the applicant', async () => {
    const { applicationNumber } = await submit();

    await AdmissionInquiry.updateOne(
      { applicationNumber },
      { $set: { notes: 'Parent seemed hesitant about fees', followUpDate: new Date() } }
    );

    const res = await request(app)
      .get('/api/v1/public/admissions/track')
      .query({ applicationNumber, phone: '9876543210' });

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/hesitant about fees/);
    expect(res.body.data).not.toHaveProperty('notes');
    expect(res.body.data).not.toHaveProperty('assignedTo');
    expect(res.body.data).not.toHaveProperty('followUpDate');
    expect(res.body.data).not.toHaveProperty('parentPhone');
    expect(res.body.data).not.toHaveProperty('schoolId');
  });
});
