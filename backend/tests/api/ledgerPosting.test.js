import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, createStudent, loginAs } from '../helpers/fixtures.js';
import { LedgerAccount } from '../../src/models/LedgerAccount.model.js';
import { JournalEntry } from '../../src/models/JournalEntry.model.js';
import { Payment } from '../../src/models/payment.model.js';
import { Refund } from '../../src/models/Refund.model.js';
import { Expense } from '../../src/models/Expense.model.js';
import { Income } from '../../src/models/Income.model.js';
import { PayrollRun } from '../../src/models/PayrollRun.model.js';
import { PayrollItem } from '../../src/models/PayrollItem.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

let seq = 0;
const oid = () => new mongoose.Types.ObjectId();

/** A school with an Accountant logged in and the default chart of accounts seeded. */
const scaffold = async () => {
  seq += 1;
  const school = await createSchool();
  const role = await createRole('Accountant', { schoolId: school._id });
  const { user } = await createUser({
    name: 'Book Keeper', email: `post-${seq}-${Date.now()}@ledger.test`,
    roleId: role._id, schoolId: school._id,
  });
  const token = await loginAs(user.email);

  await request(app).post('/api/v1/ledger/accounts/seed').set('Authorization', `Bearer ${token}`).send({});
  const accounts = await LedgerAccount.find({ schoolId: school._id }).lean();

  return { school, user, token, byCode: Object.fromEntries(accounts.map((a) => [a.code, a])) };
};

const makeStudent = async (ctx) => {
  seq += 1;
  const role = await createRole(`Student-${seq}`, { schoolId: ctx.school._id });
  const { user } = await createUser({
    name: 'Pupil', email: `pupil-${seq}-${Date.now()}@ledger.test`,
    roleId: role._id, schoolId: ctx.school._id,
  });
  return createStudent({ userId: user._id, schoolId: ctx.school._id });
};

const makePayment = async (ctx, { amount = 10000, mode = 'cash', status = 'success' } = {}) => {
  const student = await makeStudent(ctx);
  seq += 1;
  return Payment.create({
    schoolId: ctx.school._id,
    studentId: student._id,
    amountPaid: amount,
    paymentMode: mode,
    paymentDate: new Date('2026-09-01'),
    status,
    receiptNo: `RCPT-${seq}`,
  });
};

/** A payroll run plus one item on it. `status` decides whether the money has actually gone out. */
const makePayroll = async (ctx, { gross = 60000, totalDeductions = 8000, status = 'paid' } = {}) => {
  seq += 1;
  const run = await PayrollRun.create({
    schoolId: ctx.school._id,
    academicYearId: oid(),
    createdBy: ctx.user._id,
    month: 8,
    year: 2026,
    status,
  });
  return PayrollItem.create({
    schoolId: ctx.school._id,
    academicYearId: run.academicYearId,
    createdBy: ctx.user._id,
    payrollRunId: run._id,
    employeeId: oid(),
    gross,
    totalDeductions,
    netSalary: gross - totalDeductions,
  });
};

const reconcile = (ctx) =>
  request(app).get('/api/v1/ledger/reports/reconciliation').set('Authorization', `Bearer ${ctx.token}`);

const postPending = (ctx) =>
  request(app).post('/api/v1/ledger/post-pending').set('Authorization', `Bearer ${ctx.token}`).send({});

const sourceRow = (res, name) => res.body.data.sources.find((s) => s.source === name);

describe('reconciliation report', () => {
  it('lists money events that have no journal entry yet', async () => {
    const ctx = await scaffold();
    await makePayment(ctx, { amount: 10000 });

    const res = await reconcile(ctx);

    expect(res.status).toBe(200);
    expect(res.body.data.isFullyPosted).toBe(false);
    expect(sourceRow(res, 'Payment').unposted).toBe(1);
    expect(sourceRow(res, 'Payment').unpostedValue).toBe(10000);
  }, 25000);

  it('reports nothing outstanding once the sweep has run', async () => {
    const ctx = await scaffold();
    await makePayment(ctx);

    await postPending(ctx);
    const res = await reconcile(ctx);

    expect(res.body.data.isFullyPosted).toBe(true);
    expect(res.body.data.totalUnposted).toBe(0);
  }, 25000);

  it('does not count a payment that has not settled', async () => {
    const ctx = await scaffold();
    await makePayment(ctx, { status: 'pending' });

    const res = await reconcile(ctx);

    // A pending payment is not income yet, so it is not something the books are missing.
    expect(sourceRow(res, 'Payment').total).toBe(0);
    expect(res.body.data.isFullyPosted).toBe(true);
  }, 25000);
});

describe('post-pending sweep', () => {
  it('posts a cash fee receipt as Dr Cash / Cr Tuition Income', async () => {
    const ctx = await scaffold();
    const payment = await makePayment(ctx, { amount: 10000, mode: 'cash' });

    const res = await postPending(ctx);
    expect(res.body.data.posted).toBe(1);
    expect(res.body.data.problems).toHaveLength(0);

    const entry = await JournalEntry.findOne({ 'source.model': 'Payment' });
    expect(String(entry.source.documentId)).toBe(String(payment._id));
    expect(entry.status).toBe('posted');
    expect(entry.entryNumber).toMatch(/^JV-2026-\d{5}$/);

    const debit = entry.lines.find((l) => l.debit > 0);
    const credit = entry.lines.find((l) => l.credit > 0);
    expect(String(debit.accountId)).toBe(String(ctx.byCode['1000']._id));   // Cash in Hand
    expect(String(credit.accountId)).toBe(String(ctx.byCode['4000']._id));  // Tuition Fee Income
    expect(debit.debit).toBe(10000);
  }, 25000);

  it('sends a non-cash receipt to the bank account instead', async () => {
    const ctx = await scaffold();
    await makePayment(ctx, { amount: 5000, mode: 'upi' });

    await postPending(ctx);

    const entry = await JournalEntry.findOne({ 'source.model': 'Payment' });
    const debit = entry.lines.find((l) => l.debit > 0);
    expect(String(debit.accountId)).toBe(String(ctx.byCode['1010']._id));   // Bank Account
  }, 25000);

  it('posts a refund as the mirror of a receipt, netting the income back out', async () => {
    const ctx = await scaffold();
    const payment = await makePayment(ctx, { amount: 10000, mode: 'cash' });
    await Refund.create({
      schoolId: ctx.school._id,
      paymentId: payment._id,
      studentId: payment.studentId,
      amount: 4000,
      reason: 'Transport opted out',
      refundMode: 'cash',
      refundedBy: ctx.user._id,
      refundedAt: new Date('2026-09-02'),
    });

    await postPending(ctx);

    const entry = await JournalEntry.findOne({ 'source.model': 'Refund' });
    const debit = entry.lines.find((l) => l.debit > 0);
    expect(String(debit.accountId)).toBe(String(ctx.byCode['4000']._id));   // income reversed
    expect(debit.debit).toBe(4000);

    const pl = await request(app)
      .get('/api/v1/ledger/reports/profit-and-loss')
      .set('Authorization', `Bearer ${ctx.token}`);
    expect(pl.body.data.totalIncome).toBe(6000);
  }, 25000);

  it('holds an adjustment refund against fees receivable instead of paying it out', async () => {
    const ctx = await scaffold();
    const payment = await makePayment(ctx, { amount: 10000 });
    await Refund.create({
      schoolId: ctx.school._id,
      paymentId: payment._id,
      studentId: payment.studentId,
      amount: 1000,
      reason: 'Credited to next term',
      refundMode: 'adjustment',
      refundedBy: ctx.user._id,
    });

    await postPending(ctx);

    const entry = await JournalEntry.findOne({ 'source.model': 'Refund' });
    const credit = entry.lines.find((l) => l.credit > 0);
    // No money left the school, so neither cash nor bank may move.
    expect(String(credit.accountId)).toBe(String(ctx.byCode['1100']._id));  // Fees Receivable
  }, 25000);

  it('splits a salary into gross cost, statutory dues and net paid', async () => {
    const ctx = await scaffold();
    await makePayroll(ctx, { gross: 60000, totalDeductions: 8000 });

    const res = await postPending(ctx);
    expect(res.body.data.problems).toHaveLength(0);

    const entry = await JournalEntry.findOne({ 'source.model': 'PayrollItem' });
    const byAccount = Object.fromEntries(entry.lines.map((l) => [String(l.accountId), l]));
    expect(entry.lines).toHaveLength(3);
    expect(byAccount[String(ctx.byCode['5000']._id)].debit).toBe(60000);   // Salaries & Wages
    expect(byAccount[String(ctx.byCode['2020']._id)].credit).toBe(8000);   // Statutory Dues Payable
    expect(byAccount[String(ctx.byCode['1010']._id)].credit).toBe(52000);  // Bank Account
  }, 25000);

  it('ignores a payroll run that has not been disbursed yet', async () => {
    const ctx = await scaffold();
    await makePayroll(ctx, { status: 'approved' });

    const res = await postPending(ctx);
    const recon = await reconcile(ctx);

    // Approval authorises the payout; it is not the payout. Crediting the bank here would show
    // money leaving an account it is still sitting in.
    expect(res.body.data.posted).toBe(0);
    expect(sourceRow(recon, 'PayrollItem').total).toBe(0);
  }, 25000);

  it('maps an expense category to its own account', async () => {
    const ctx = await scaffold();
    await Expense.create({
      schoolId: ctx.school._id, title: 'September power bill', category: 'Utility Bills',
      amount: 7000, date: new Date('2026-09-02'), paymentMode: 'bank_transfer', status: 'paid',
      createdBy: ctx.user._id,
    });

    await postPending(ctx);

    const entry = await JournalEntry.findOne({ 'source.model': 'Expense' });
    const debit = entry.lines.find((l) => l.debit > 0);
    expect(String(debit.accountId)).toBe(String(ctx.byCode['5030']._id));   // Electricity & Utilities
    expect(debit.debit).toBe(7000);
  }, 25000);

  it('leaves an unpaid expense alone', async () => {
    const ctx = await scaffold();
    await Expense.create({
      schoolId: ctx.school._id, title: 'Awaiting approval', category: 'Maintenance',
      amount: 5000, date: new Date('2026-09-02'), status: 'pending', createdBy: ctx.user._id,
    });

    const res = await postPending(ctx);

    expect(res.body.data.posted).toBe(0);
    expect(await JournalEntry.countDocuments({})).toBe(0);
  }, 25000);

  it('falls back to Other Income rather than skipping an unmapped category', async () => {
    const ctx = await scaffold();
    await Income.create({
      schoolId: ctx.school._id, title: 'Hall hire', category: 'Rental Income',
      amount: 3000, date: new Date('2026-09-02'), paymentMode: 'cash', createdBy: ctx.user._id,
    });

    await postPending(ctx);

    const entry = await JournalEntry.findOne({ 'source.model': 'Income' });
    const credit = entry.lines.find((l) => l.credit > 0);
    // "Rental Income" has no dedicated head — an unposted event is worse than a coarse one.
    expect(String(credit.accountId)).toBe(String(ctx.byCode['4080']._id));  // Other Income
  }, 25000);

  it('is idempotent — a second sweep posts nothing', async () => {
    const ctx = await scaffold();
    await makePayment(ctx);

    const first = await postPending(ctx);
    const second = await postPending(ctx);

    expect(first.body.data.posted).toBe(1);
    expect(second.body.data.posted).toBe(0);
    expect(await JournalEntry.countDocuments({})).toBe(1);
  }, 25000);

  it('numbers swept entries in the same sequence as hand-written ones', async () => {
    const ctx = await scaffold();
    await request(app)
      .post('/api/v1/ledger/entries')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({
        date: '2026-09-01', narration: 'Opening cash', post: true,
        lines: [
          { accountId: ctx.byCode['1000']._id, debit: 1000, credit: 0 },
          { accountId: ctx.byCode['3000']._id, debit: 0, credit: 1000 },
        ],
      });
    await makePayment(ctx);
    await makePayment(ctx);

    await postPending(ctx);

    const numbers = (await JournalEntry.find({}).sort({ entryNumber: 1 }).select('entryNumber').lean())
      .map((e) => e.entryNumber);
    // An auditor should not be able to tell which entries the sweep produced.
    expect(numbers).toEqual(['JV-2026-00001', 'JV-2026-00002', 'JV-2026-00003']);
  }, 25000);

  it('leaves the trial balance balanced after sweeping mixed events', async () => {
    const ctx = await scaffold();
    await makePayment(ctx, { amount: 50000, mode: 'cash' });
    await Expense.create({
      schoolId: ctx.school._id, title: 'Rent', category: 'Rent',
      amount: 20000, date: new Date('2026-09-02'), paymentMode: 'cash', status: 'paid',
      createdBy: ctx.user._id,
    });

    await postPending(ctx);

    const tb = await request(app)
      .get('/api/v1/ledger/reports/trial-balance')
      .set('Authorization', `Bearer ${ctx.token}`);
    expect(tb.body.data.isBalanced).toBe(true);

    const pl = await request(app)
      .get('/api/v1/ledger/reports/profit-and-loss')
      .set('Authorization', `Bearer ${ctx.token}`);
    expect(pl.body.data.totalIncome).toBe(50000);
    expect(pl.body.data.totalExpense).toBe(20000);
    expect(pl.body.data.surplus).toBe(30000);
  }, 25000);

  it('never sweeps another school money events into these books', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    await makePayment(theirs, { amount: 12345 });

    const res = await postPending(mine);

    expect(res.body.data.posted).toBe(0);
    expect(await JournalEntry.countDocuments({ schoolId: mine.school._id })).toBe(0);
  }, 25000);

  it('reports a missing account instead of silently dropping the event', async () => {
    const ctx = await scaffold();
    await makePayment(ctx, { amount: 10000, mode: 'cash' });
    await LedgerAccount.deleteOne({ _id: ctx.byCode['4000']._id });

    const res = await postPending(ctx);

    expect(res.body.data.posted).toBe(0);
    expect(res.body.data.problems).toHaveLength(1);
    expect(res.body.data.problems[0].reason).toMatch(/4000/);
    // Still flagged as outstanding, so the accountant sees it until the account is restored.
    const recon = await reconcile(ctx);
    expect(recon.body.data.isFullyPosted).toBe(false);
  }, 25000);
});
