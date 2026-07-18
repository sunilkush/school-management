import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool, createRole, createUser, createEmployee, markPresent, loginAs,
} from '../helpers/fixtures.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const CYCLE_MONTH = 7;
const CYCLE_YEAR = 2026;

// Builds one full, real school + admin + employee + attendance scenario via the actual HTTP
// endpoints (not direct model writes) for the pieces that are supposed to be reachable that
// way, so this exercises the same code path a real admin's browser would.
async function setupSchoolAndAdmin() {
  const school = await createSchool();
  const adminRole = await createRole('School Admin');
  const employeeRole = await createRole('Staff');
  const { user: adminUser } = await createUser({
    name: 'Admin User', email: 'admin@payroll.test', roleId: adminRole._id, schoolId: school._id,
  });
  const adminToken = await loginAs(adminUser.email);
  return { school, adminRole, employeeRole, adminUser, adminToken };
}

async function setupEmployee({ school, employeeRole, adminUser }) {
  const { user: empUser } = await createUser({
    name: 'Jane Employee', email: 'jane@payroll.test', roleId: employeeRole._id, schoolId: school._id,
  });
  const employee = await createEmployee({
    userId: empUser._id, schoolId: school._id, designation: 'Clerk',
  });
  await markPresent({ schoolId: school._id, userId: empUser._id, markedBy: adminUser._id, count: 22, asOf: new Date(`${CYCLE_YEAR}-${String(CYCLE_MONTH).padStart(2, '0')}-25`) });
  return { empUser, employee };
}

describe('Payroll module — full lifecycle (Settings → Structure → Cycle → Payslip → Reports)', () => {
  it('links every stage together: custom settings actually drive the calculated payslip', async () => {
    const { school, employeeRole, adminUser, adminToken } = await setupSchoolAndAdmin();
    const { empUser, employee } = await setupEmployee({ school, employeeRole, adminUser });

    // 1) Configure non-default Payroll Settings — the whole point is proving these, not the
    //    statutory defaults, are what the rest of the pipeline actually uses.
    const settingsRes = await request(app)
      .post('/api/v1/payroll/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        pfPercent: 10, // non-default (statutory default is 12)
        pfWageCeiling: 15000,
        pfAppliedOnCeiling: true,
        employerPfPercent: 10,
        epsPercent: 8.33,
        esiPercent: 1, // non-default (statutory default is 0.75)
        esiWageCeiling: 21000,
        employerEsiPercent: 3.25,
        professionalTaxAmount: 150,
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
      });
    expect(settingsRes.status).toBe(201);

    const settingsListRes = await request(app)
      .get('/api/v1/payroll/settings')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(settingsListRes.status).toBe(200);
    expect(settingsListRes.body.data.current.pfPercent).toBe(10);
    expect(settingsListRes.body.data.versions).toHaveLength(1);

    // 2) Set the employee's UAN/ESIC via the dedicated statutory endpoint.
    const statutoryRes = await request(app)
      .patch(`/api/v1/payroll/employee/${employee._id}/statutory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ uan: '123456789012', esicNumber: '1234567890' });
    expect(statutoryRes.status).toBe(200);
    expect(statutoryRes.body.data.uan).toBe('123456789012');

    // 3) Create the salary structure — Basic + DA = 12,000, gross = 18,000. Whether PF/ESI
    //    apply is decided here; the wage-base methodology (basicPlusDa/gross) is the school's
    //    Payroll Settings from step 1, not repeated on the structure.
    const structureRes = await request(app)
      .post('/api/v1/payroll/structure')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        employeeId: employee._id.toString(),
        basic: 10000,
        da: 2000,
        hra: 3000,
        specialAllowance: 3000,
        grossMonthly: 18000,
        professionalTaxEnabled: true,
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
        status: 'active',
      });
    expect(structureRes.status).toBe(201);

    // 4) Generate the payroll cycle.
    const generateRes = await request(app)
      .post('/api/v1/payroll/cycle/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });
    expect(generateRes.status).toBe(201);
    expect(generateRes.body.data.entriesCount).toBe(1);
    const cycleId = generateRes.body.data.cycle._id;

    // 5) Fetch the cycle and verify the entry used the CUSTOM 10%/1% rates, not the 12%/0.75%
    //    statutory defaults — this is the core "settings and structure are actually linked" check.
    const cycleRes = await request(app)
      .get(`/api/v1/payroll/cycle/${CYCLE_MONTH}/${CYCLE_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString() });
    expect(cycleRes.status).toBe(200);
    const entry = cycleRes.body.data.entries[0];
    expect(entry.deductionsBreakdown.pf).toBeCloseTo(1200); // 10% of min(12000, 15000)
    expect(entry.deductionsBreakdown.esi).toBeCloseTo(180); // 1% of 18000 (gross <= 21000 ceiling)
    expect(entry.deductionsBreakdown.professionalTax).toBe(150);
    expect(entry.employerContributions.pfTotal).toBeCloseTo(1200); // 10% employer PF
    expect(entry.employerContributions.eps).toBeCloseTo(999.6); // 8.33% of 12000
    expect(entry.statutorySnapshot.uan).toBe('123456789012');
    expect(entry.statutorySnapshot.esicNumber).toBe('1234567890');
    expect(entry.netPay).toBeCloseTo(18000 - entry.totalDeductions);

    // 6) Payslip JSON endpoint returns the same figures.
    const payslipRes = await request(app)
      .get(`/api/v1/payroll/payslip/${employee._id}/${CYCLE_MONTH}/${CYCLE_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString() });
    expect(payslipRes.status).toBe(200);
    expect(payslipRes.body.data.entry.netPay).toBeCloseTo(entry.netPay);

    // 7) Payslip PDF download actually returns a PDF.
    const pdfRes = await request(app)
      .get(`/api/v1/payroll/payslip/${employee._id}/${CYCLE_MONTH}/${CYCLE_YEAR}/download`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString() })
      .buffer(true)
      .parse((res, cb) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.body.slice(0, 4).toString()).toBe('%PDF');

    // 8) PF report and ESI report both list this employee with the right figures.
    const pfReportRes = await request(app)
      .get('/api/v1/payroll/reports/pf')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });
    expect(pfReportRes.status).toBe(200);
    expect(pfReportRes.body.data.rows).toHaveLength(1);
    expect(pfReportRes.body.data.rows[0].uan).toBe('123456789012');
    expect(pfReportRes.body.data.rows[0].employeePf).toBeCloseTo(1200);

    const esiReportRes = await request(app)
      .get('/api/v1/payroll/reports/esi')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });
    expect(esiReportRes.status).toBe(200);
    expect(esiReportRes.body.data.rows).toHaveLength(1);
    expect(esiReportRes.body.data.rows[0].esicNumber).toBe('1234567890');

    // 9) CSV export mode returns a CSV, not JSON.
    const csvRes = await request(app)
      .get('/api/v1/payroll/reports/pf')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR, export: 'csv' });
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toMatch(/^text\/csv/);
    expect(csvRes.text).toContain('123456789012');

    // 10) Lock, then pay, the cycle.
    const lockRes = await request(app)
      .post(`/api/v1/payroll/cycle/${cycleId}/lock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString() });
    expect(lockRes.status).toBe(200);
    expect(lockRes.body.data.status).toBe('locked');

    const payRes = await request(app)
      .post(`/api/v1/payroll/cycle/${cycleId}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString(), paymentMode: 'bank' });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.paidEntries).toBe(1);

    // 11) A paid cycle cannot be regenerated.
    const regenRes = await request(app)
      .post('/api/v1/payroll/cycle/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });
    expect(regenRes.status).toBe(409);

    // 12) The employee sees their own paid payslip (with employer contributions) via self-service.
    const empToken = await loginAs(empUser.email);
    const selfRes = await request(app)
      .get('/api/v1/payroll/self/summary')
      .set('Authorization', `Bearer ${empToken}`);
    expect(selfRes.status).toBe(200);
    expect(selfRes.body.data.payslips).toHaveLength(1);
    expect(selfRes.body.data.payslips[0].paymentStatus).toBe('paid');
    expect(selfRes.body.data.payslips[0].employerContributions.pfTotal).toBeCloseTo(1200);

    // 13) The employee cannot view a co-worker's payslip.
    const { user: otherUser } = await createUser({
      name: 'Other Staff', email: 'other@payroll.test', roleId: employeeRole._id, schoolId: school._id,
    });
    await createEmployee({ userId: otherUser._id, schoolId: school._id });
    const otherToken = await loginAs(otherUser.email);
    const forbiddenRes = await request(app)
      .get(`/api/v1/payroll/payslip/${employee._id}/${CYCLE_MONTH}/${CYCLE_YEAR}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .query({ schoolId: school._id.toString() });
    expect(forbiddenRes.status).toBe(403);
  });

  it('an employee above the ESI wage ceiling is not ESI-deducted even with ESI enabled school-wide', async () => {
    const { school, employeeRole, adminUser, adminToken } = await setupSchoolAndAdmin();
    const { employee } = await setupEmployee({ school, employeeRole, adminUser });

    await request(app)
      .post('/api/v1/payroll/structure')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        employeeId: employee._id.toString(),
        basic: 20000,
        da: 0,
        grossMonthly: 35000, // above the 21,000 ESI ceiling
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
        status: 'active',
      });

    const generateRes = await request(app)
      .post('/api/v1/payroll/cycle/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });
    expect(generateRes.status).toBe(201);

    const cycleRes = await request(app)
      .get(`/api/v1/payroll/cycle/${CYCLE_MONTH}/${CYCLE_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString() });
    const entry = cycleRes.body.data.entries[0];
    expect(entry.deductionsBreakdown.esiEligible).toBe(false);
    expect(entry.deductionsBreakdown.esi).toBe(0);
    expect(entry.deductionsBreakdown.pf).toBeCloseTo(1800); // 12% (default) of capped 15,000 — no custom settings created in this test
  });

  it('PF/ESI on/off is a single school-wide switch in Payroll Settings — the salary structure has no toggle of its own', async () => {
    const { school, employeeRole, adminUser, adminToken } = await setupSchoolAndAdmin();
    const { employee } = await setupEmployee({ school, employeeRole, adminUser });

    // Sending pfEnabled/esiEnabled to the statutory (identity-only) endpoint is silently
    // stripped — it's not part of that schema, so it can't create a second, conflicting place
    // PF/ESI gets toggled from. A real field (pfCategory) alongside them still goes through.
    const statutoryRes = await request(app)
      .patch(`/api/v1/payroll/employee/${employee._id}/statutory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pfCategory: 'general', pfEnabled: false, esiEnabled: false });
    expect(statutoryRes.status).toBe(200);
    expect(statutoryRes.body.data.pfEnabled).toBeUndefined();
    expect(statutoryRes.body.data.esiEnabled).toBeUndefined();

    // Sending pfEnabled/esiEnabled to the structure endpoint is likewise silently ignored —
    // the only place this school-wide switch can actually be set is Payroll Settings.
    const settingsRes = await request(app)
      .post('/api/v1/payroll/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        pfEnabled: false,
        esiEnabled: false,
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
      });
    expect(settingsRes.status).toBe(201);
    expect(settingsRes.body.data.pfEnabled).toBe(false);
    expect(settingsRes.body.data.esiEnabled).toBe(false);

    await request(app)
      .post('/api/v1/payroll/structure')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        employeeId: employee._id.toString(),
        basic: 10000,
        da: 2000,
        grossMonthly: 18000,
        pfEnabled: true, // ignored — not part of the structure schema
        esiEnabled: true, // ignored — not part of the structure schema
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
        status: 'active',
      });

    await request(app)
      .post('/api/v1/payroll/cycle/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });

    const cycleRes = await request(app)
      .get(`/api/v1/payroll/cycle/${CYCLE_MONTH}/${CYCLE_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString() });
    const entry = cycleRes.body.data.entries[0];

    expect(entry.deductionsBreakdown.pf).toBe(0);
    expect(entry.deductionsBreakdown.esi).toBe(0);
    expect(entry.employerContributions.pfTotal).toBe(0);
    expect(entry.employerContributions.esi).toBe(0);
  });

  it('an employee individually marked pfCategory/esiCategory "excluded" is exempted even though PF/ESI are on school-wide', async () => {
    const { school, employeeRole, adminUser, adminToken } = await setupSchoolAndAdmin();
    const { employee } = await setupEmployee({ school, employeeRole, adminUser });

    // School-wide switch stays on (the default) — only this one employee opts out.
    const statutoryRes = await request(app)
      .patch(`/api/v1/payroll/employee/${employee._id}/statutory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pfCategory: 'excluded', esiCategory: 'excluded' });
    expect(statutoryRes.status).toBe(200);
    expect(statutoryRes.body.data.pfCategory).toBe('excluded');
    expect(statutoryRes.body.data.esiCategory).toBe('excluded');

    await request(app)
      .post('/api/v1/payroll/structure')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        employeeId: employee._id.toString(),
        basic: 10000,
        da: 2000,
        grossMonthly: 18000,
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
        status: 'active',
      });

    await request(app)
      .post('/api/v1/payroll/cycle/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });

    const cycleRes = await request(app)
      .get(`/api/v1/payroll/cycle/${CYCLE_MONTH}/${CYCLE_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString() });
    const entry = cycleRes.body.data.entries[0];

    expect(entry.deductionsBreakdown.pf).toBe(0);
    expect(entry.deductionsBreakdown.esi).toBe(0);
    expect(entry.employerContributions.pfTotal).toBe(0);
    expect(entry.employerContributions.esi).toBe(0);
  });

  it('rejects assigning a UAN that is already used by another employee in the school', async () => {
    const { school, employeeRole, adminUser, adminToken } = await setupSchoolAndAdmin();
    const { employee: employeeA } = await setupEmployee({ school, employeeRole, adminUser });
    const { user: userB } = await createUser({
      name: 'Employee B', email: 'empb@payroll.test', roleId: employeeRole._id, schoolId: school._id,
    });
    const employeeB = await createEmployee({ userId: userB._id, schoolId: school._id });

    const firstRes = await request(app)
      .patch(`/api/v1/payroll/employee/${employeeA._id}/statutory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ uan: '111122223333' });
    expect(firstRes.status).toBe(200);

    const clashRes = await request(app)
      .patch(`/api/v1/payroll/employee/${employeeB._id}/statutory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ uan: '111122223333' });
    expect(clashRes.status).toBe(409);
  });

  it('rejects a "custom" PF wage-base setting with no components picked, instead of silently zeroing the wage school-wide', async () => {
    const { school, employeeRole, adminUser, adminToken } = await setupSchoolAndAdmin();
    const { employee } = await setupEmployee({ school, employeeRole, adminUser });

    const emptyCustomRes = await request(app)
      .post('/api/v1/payroll/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        pfApplicableOn: 'custom',
        pfCustomComponents: [],
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
      });
    expect(emptyCustomRes.status).toBe(400);

    // With components actually picked, the PF wage sums exactly those fields, for every
    // PF-enabled employee at this school.
    const withComponentsRes = await request(app)
      .post('/api/v1/payroll/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        pfApplicableOn: 'custom',
        pfCustomComponents: ['basic', 'hra'], // deliberately excludes da
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
      });
    expect(withComponentsRes.status).toBe(201);

    await request(app)
      .post('/api/v1/payroll/structure')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId: school._id.toString(),
        employeeId: employee._id.toString(),
        basic: 8000,
        hra: 2000,
        da: 1000,
        grossMonthly: 11000,
        effectiveFrom: `${CYCLE_YEAR - 1}-01-01`,
        status: 'active',
      });

    await request(app)
      .post('/api/v1/payroll/cycle/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ schoolId: school._id.toString(), month: CYCLE_MONTH, year: CYCLE_YEAR });

    const cycleRes = await request(app)
      .get(`/api/v1/payroll/cycle/${CYCLE_MONTH}/${CYCLE_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ schoolId: school._id.toString() });
    const entry = cycleRes.body.data.entries[0];
    expect(entry.deductionsBreakdown.pfWage).toBe(10000); // basic 8000 + hra 2000, da excluded
    expect(entry.deductionsBreakdown.pf).toBeCloseTo(1200); // 12% default of 10000
  });

  it('a school with no configured settings yet still lists its auto-bootstrapped default in history', async () => {
    const { adminToken } = await setupSchoolAndAdmin();

    const res = await request(app)
      .get('/api/v1/payroll/settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.current).toBeTruthy();
    // The very first call is what used to show an empty history despite "current" existing.
    expect(res.body.data.versions).toHaveLength(1);
    expect(res.body.data.versions[0]._id).toBe(res.body.data.current._id);
  });
});
