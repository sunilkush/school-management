import request from 'supertest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createStudentFee } from '../helpers/fixtures.js';
import { FeeInstallment } from '../../src/models/feeInstallment.model.js';
import { StudentFee } from '../../src/models/studentFee.model.js';
import { Payment } from '../../src/models/payment.model.js';
import { GlobalConfig } from '../../src/models/GlobalConfig.model.js';
import { SubscriptionPlan } from '../../src/models/SubscriptionPlan.model.js';
import { SchoolSubscription } from '../../src/models/schoolSubscription.model.js';
import { SubscriptionInvoice } from '../../src/models/SubscriptionInvoice.model.js';
import { SubscriptionPayment } from '../../src/models/SubscriptionPayment.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const sign = (secret, payload) =>
  crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

const buildRazorpayWebhookPayload = ({ event = 'payment.captured', paymentId, orderId, amountPaise, notes }) => ({
  entity: 'event',
  event,
  payload: {
    payment: {
      entity: {
        id: paymentId,
        order_id: orderId,
        amount: amountPaise,
        status: event === 'payment.captured' ? 'captured' : 'failed',
        notes,
      },
    },
  },
});

describe('POST /webhooks/razorpay — fee collection (Parent pays School)', () => {
  it('rejects a payload with an invalid signature, leaving the fee untouched', async () => {
    const school = await createSchool({ razorpay: { webhookSecret: 'school-secret', keyId: 'rzp_test_key', isEnabled: true } });
    const studentFee = await createStudentFee({ schoolId: school._id, studentId: new mongoose.Types.ObjectId(), totalAmount: 1000 });
    const installment = await FeeInstallment.create({
      schoolId: school._id, academicYearId: studentFee.academicYearId, studentId: studentFee.studentId,
      studentFeeId: studentFee._id, installmentName: 'Q1', amount: 1000, paidAmount: 0, dueDate: new Date(), status: 'pending',
    });

    const payload = buildRazorpayWebhookPayload({
      paymentId: 'pay_test1', orderId: 'order_test1', amountPaise: 100000,
      notes: { installmentId: installment._id.toString(), schoolId: school._id.toString() },
    });

    const response = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('X-Razorpay-Signature', 'not-the-real-signature')
      .send(payload);

    expect(response.status).toBe(400);
    const unchanged = await FeeInstallment.findById(installment._id);
    expect(unchanged.paidAmount).toBe(0);
  }, 15000);

  it('applies a validly-signed payment.captured event to both the installment and its parent StudentFee', async () => {
    const secret = 'school-secret-2';
    const school = await createSchool({ razorpay: { webhookSecret: secret, keyId: 'rzp_test_key', isEnabled: true } });
    const studentFee = await createStudentFee({ schoolId: school._id, studentId: new mongoose.Types.ObjectId(), totalAmount: 1000 });
    const installment = await FeeInstallment.create({
      schoolId: school._id, academicYearId: studentFee.academicYearId, studentId: studentFee.studentId,
      studentFeeId: studentFee._id, installmentName: 'Q1', amount: 1000, paidAmount: 0, dueDate: new Date(), status: 'pending',
    });

    const payload = buildRazorpayWebhookPayload({
      paymentId: 'pay_test2', orderId: 'order_test2', amountPaise: 100000,
      notes: { installmentId: installment._id.toString(), schoolId: school._id.toString() },
    });
    const signature = sign(secret, payload);

    const response = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('X-Razorpay-Signature', signature)
      .send(payload);

    expect(response.status).toBe(200);

    const updatedInstallment = await FeeInstallment.findById(installment._id);
    expect(updatedInstallment.paidAmount).toBe(1000);
    expect(updatedInstallment.status).toBe('paid');

    const updatedFee = await StudentFee.findById(studentFee._id);
    expect(updatedFee.paidAmount).toBe(1000);
    expect(updatedFee.status).toBe('paid');
  }, 15000);

  it('is idempotent — the same payment id delivered twice only records one Payment', async () => {
    const secret = 'school-secret-3';
    const school = await createSchool({ razorpay: { webhookSecret: secret, keyId: 'rzp_test_key', isEnabled: true } });
    const studentFee = await createStudentFee({ schoolId: school._id, studentId: new mongoose.Types.ObjectId(), totalAmount: 1000 });
    const installment = await FeeInstallment.create({
      schoolId: school._id, academicYearId: studentFee.academicYearId, studentId: studentFee.studentId,
      studentFeeId: studentFee._id, installmentName: 'Q1', amount: 1000, paidAmount: 0, dueDate: new Date(), status: 'pending',
    });

    const payload = buildRazorpayWebhookPayload({
      paymentId: 'pay_duplicate', orderId: 'order_duplicate', amountPaise: 100000,
      notes: { installmentId: installment._id.toString(), schoolId: school._id.toString() },
    });
    const signature = sign(secret, payload);

    const first = await request(app).post('/api/v1/webhooks/razorpay').set('X-Razorpay-Signature', signature).send(payload);
    const second = await request(app).post('/api/v1/webhooks/razorpay').set('X-Razorpay-Signature', signature).send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const payments = await Payment.find({ transactionId: 'pay_duplicate' });
    expect(payments).toHaveLength(1);

    const updatedFee = await StudentFee.findById(studentFee._id);
    // Not double-credited — a second, unguarded delivery would have pushed this to 2000.
    expect(updatedFee.paidAmount).toBe(1000);
  }, 15000);
});

describe('POST /webhooks/razorpay — SaaS billing (School pays platform)', () => {
  const setupInvoice = async () => {
    const school = await createSchool();
    const plan = await SubscriptionPlan.create({ name: 'Premium Plan', price: 999, durationInDays: 30 });
    const subscription = await SchoolSubscription.create({
      schoolId: school._id, planId: plan._id,
      snapshot: { price: 999, durationInDays: 30, features: [], limits: {} },
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const invoice = await SubscriptionInvoice.create({
      schoolId: school._id, subscriptionId: subscription._id, invoiceNumber: 'INV-TEST-001',
      billingPeriodStart: new Date(), billingPeriodEnd: subscription.endDate,
      planPrice: 999, totalAmount: 999, dueDate: subscription.endDate, status: 'unpaid',
    });
    return { school, invoice };
  };

  it('applies a validly-signed payment.captured event and marks the invoice paid', async () => {
    const secret = 'platform-webhook-secret';
    await GlobalConfig.create({ key: 'global', razorpayWebhookSecret: secret });
    const { invoice } = await setupInvoice();

    const payload = buildRazorpayWebhookPayload({
      paymentId: 'pay_saas_1', orderId: 'order_saas_1', amountPaise: 99900,
      notes: { invoiceId: invoice._id.toString() },
    });
    const signature = sign(secret, payload);

    const response = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('X-Razorpay-Signature', signature)
      .send(payload);

    expect(response.status).toBe(200);
    const updatedInvoice = await SubscriptionInvoice.findById(invoice._id);
    expect(updatedInvoice.status).toBe('paid');

    const payments = await SubscriptionPayment.find({ transactionId: 'pay_saas_1' });
    expect(payments).toHaveLength(1);
  }, 15000);

  it('rejects a SaaS-billing webhook signed with the wrong (fee-collection) secret', async () => {
    await GlobalConfig.create({ key: 'global', razorpayWebhookSecret: 'the-real-platform-secret' });
    const { invoice } = await setupInvoice();

    const payload = buildRazorpayWebhookPayload({
      paymentId: 'pay_saas_2', orderId: 'order_saas_2', amountPaise: 99900,
      notes: { invoiceId: invoice._id.toString() },
    });
    const wrongSignature = sign('some-other-secret', payload);

    const response = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('X-Razorpay-Signature', wrongSignature)
      .send(payload);

    expect(response.status).toBe(400);
    const unchangedInvoice = await SubscriptionInvoice.findById(invoice._id);
    expect(unchangedInvoice.status).toBe('unpaid');
  }, 15000);
});
