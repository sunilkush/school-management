import request from 'supertest';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';
import { SubscriptionPlan } from '../../src/models/SubscriptionPlan.model.js';
import { SchoolSubscription } from '../../src/models/schoolSubscription.model.js';
import { SubscriptionInvoice } from '../../src/models/SubscriptionInvoice.model.js';
import { SubscriptionPayment } from '../../src/models/SubscriptionPayment.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

let planCounter = 0;

// Plans are platform-wide by default (customForSchoolId: null), unique on {name,
// customForSchoolId} — a fresh name per call avoids colliding across schools in the same test.
const setupSubscriptionAndInvoice = async (school) => {
  planCounter += 1;
  const plan = await SubscriptionPlan.create({ name: `Premium Plan ${planCounter}`, price: 999, durationInDays: 30 });
  const subscription = await SchoolSubscription.create({
    schoolId: school._id, planId: plan._id,
    snapshot: { price: 999, durationInDays: 30, features: [], limits: {} },
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const invoice = await SubscriptionInvoice.create({
    schoolId: school._id, subscriptionId: subscription._id, invoiceNumber: `INV-${Date.now()}-${planCounter}`,
    billingPeriodStart: new Date(), billingPeriodEnd: subscription.endDate,
    planPrice: 999, totalAmount: 999, dueDate: subscription.endDate, status: 'unpaid',
  });
  return { subscription, invoice };
};

describe('GET /school-billing/subscription — tenant isolation', () => {
  it("a School Admin only ever sees their own school's subscription, never another's", async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    await setupSubscriptionAndInvoice(schoolA);
    const { subscription: subB } = await setupSubscriptionAndInvoice(schoolB);

    const adminRole = await createRole('School Admin', { schoolId: schoolA._id });
    const { user: admin } = await createUser({ name: 'Admin A', email: 'admin@schoolA-bill.test', roleId: adminRole._id, schoolId: schoolA._id });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .get('/api/v1/school-billing/subscription')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data._id).not.toBe(subB._id.toString());
  }, 15000);
});

describe('GET/POST /school-billing/invoices — tenant isolation', () => {
  it("a School Admin cannot pay another school's invoice by guessing its id", async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    await setupSubscriptionAndInvoice(schoolA);
    const { invoice: invoiceB } = await setupSubscriptionAndInvoice(schoolB);

    const adminRole = await createRole('School Admin', { schoolId: schoolA._id });
    const { user: admin } = await createUser({ name: 'Admin A2', email: 'admin2@schoolA-bill.test', roleId: adminRole._id, schoolId: schoolA._id });
    const token = await loginAs(admin.email);

    const response = await request(app)
      .post(`/api/v1/school-billing/invoices/${invoiceB._id}/pay/intent`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    const unchanged = await SubscriptionInvoice.findById(invoiceB._id);
    expect(unchanged.status).toBe('unpaid');
  }, 15000);
});

describe('POST /super-admin/billing/payments/:paymentId/refund — validation', () => {
  // The success path (actually calling Razorpay's refund API) isn't exercised here — that
  // would need a real gateway/network call this test environment doesn't have. It reuses the
  // exact same atomic-guard update pattern already covered by payment.controllers.js's
  // refundPayment tests for the fee-collection side. These cover every rejection path, which
  // never reaches the gateway call.
  it('rejects a refund amount exceeding the refundable balance', async () => {
    const school = await createSchool();
    const { invoice } = await setupSubscriptionAndInvoice(school);
    const payment = await SubscriptionPayment.create({
      schoolId: school._id, invoiceId: invoice._id, amount: 999, paymentMode: 'gateway',
      transactionId: 'pay_refund_test2', gatewayProvider: 'razorpay', status: 'success',
    });

    const superAdminRole = await createRole('Super Admin');
    const { user: superAdmin } = await createUser({ name: 'Super Admin 2', email: 'superadmin-refund2@test.example', roleId: superAdminRole._id, schoolId: school._id });
    const token = await loginAs(superAdmin.email);

    const response = await request(app)
      .post(`/api/v1/super-admin/billing/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000, reason: 'Too much' });

    expect(response.status).toBe(400);
    const unchanged = await SubscriptionPayment.findById(payment._id);
    expect(unchanged.refundAmount).toBe(0);
  }, 15000);

  it('rejects a refund with no reason', async () => {
    const school = await createSchool();
    const { invoice } = await setupSubscriptionAndInvoice(school);
    const payment = await SubscriptionPayment.create({
      schoolId: school._id, invoiceId: invoice._id, amount: 999, paymentMode: 'gateway',
      transactionId: 'pay_refund_test3', gatewayProvider: 'razorpay', status: 'success',
    });

    const superAdminRole = await createRole('Super Admin');
    const { user: superAdmin } = await createUser({ name: 'Super Admin 3', email: 'superadmin-refund3@test.example', roleId: superAdminRole._id, schoolId: school._id });
    const token = await loginAs(superAdmin.email);

    const response = await request(app)
      .post(`/api/v1/super-admin/billing/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 999 });

    expect(response.status).toBe(400);
  }, 15000);

  it('rejects a refund for a payment with no gateway transaction to reverse (manual/offline payment)', async () => {
    const school = await createSchool();
    const { invoice } = await setupSubscriptionAndInvoice(school);
    const payment = await SubscriptionPayment.create({
      schoolId: school._id, invoiceId: invoice._id, amount: 999, paymentMode: 'cash', status: 'success',
    });

    const superAdminRole = await createRole('Super Admin');
    const { user: superAdmin } = await createUser({ name: 'Super Admin 4', email: 'superadmin-refund4@test.example', roleId: superAdminRole._id, schoolId: school._id });
    const token = await loginAs(superAdmin.email);

    const response = await request(app)
      .post(`/api/v1/super-admin/billing/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 999, reason: 'Testing manual payment rejection' });

    expect(response.status).toBe(400);
    const unchanged = await SubscriptionPayment.findById(payment._id);
    expect(unchanged.refundAmount).toBe(0);
  }, 15000);
});
