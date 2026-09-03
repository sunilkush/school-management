import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import { createSchool, createRole, createUser, loginAs } from '../helpers/fixtures.js';
import { LedgerAccount } from '../../src/models/LedgerAccount.model.js';
import { JournalEntry } from '../../src/models/JournalEntry.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

let seq = 0;

/** A school with an Accountant logged in and the default chart of accounts seeded. */
const scaffold = async () => {
  seq += 1;
  const school = await createSchool();
  const role = await createRole('Accountant', { schoolId: school._id });
  const { user } = await createUser({
    name: 'Book Keeper', email: `acct-${seq}-${Date.now()}@ledger.test`,
    roleId: role._id, schoolId: school._id,
  });
  const token = await loginAs(user.email);

  await request(app).post('/api/v1/ledger/accounts/seed').set('Authorization', `Bearer ${token}`).send({});

  const accounts = await LedgerAccount.find({ schoolId: school._id }).lean();
  const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));
  return { school, token, byCode };
};

const entry = (ctx, lines, extra = {}) =>
  request(app)
    .post('/api/v1/ledger/entries')
    .set('Authorization', `Bearer ${ctx.token}`)
    .send({ date: '2026-09-01', narration: 'Test', lines, post: true, ...extra });

/** Fee received in cash: Dr Cash 10,000 / Cr Tuition Fee Income 10,000. */
const feeReceipt = (ctx, amount = 10000) =>
  entry(ctx, [
    { accountId: ctx.byCode['1000']._id, debit: amount, credit: 0 },
    { accountId: ctx.byCode['4000']._id, debit: 0, credit: amount },
  ]);

describe('chart of accounts', () => {
  it('seeds a default chart and is safe to re-run', async () => {
    const ctx = await scaffold();
    expect(Object.keys(ctx.byCode).length).toBeGreaterThan(20);
    expect(ctx.byCode['1000'].type).toBe('asset');
    expect(ctx.byCode['4000'].type).toBe('income');

    const again = await request(app)
      .post('/api/v1/ledger/accounts/seed')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({});
    expect(again.body.data.created).toBe(0);
  }, 25000);

  it('refuses to delete an account that entries already use', async () => {
    const ctx = await scaffold();
    await feeReceipt(ctx);

    const res = await request(app)
      .delete(`/api/v1/ledger/accounts/${ctx.byCode['1000']._id}`)
      .set('Authorization', `Bearer ${ctx.token}`);

    expect(res.status).toBe(400);
    expect(await LedgerAccount.countDocuments({ _id: ctx.byCode['1000']._id })).toBe(1);
  }, 25000);
});

describe('journal entries', () => {
  it('rejects an entry whose debits do not equal its credits', async () => {
    const ctx = await scaffold();

    const res = await entry(ctx, [
      { accountId: ctx.byCode['1000']._id, debit: 10000, credit: 0 },
      { accountId: ctx.byCode['4000']._id, debit: 0, credit: 9000 },
    ]);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await JournalEntry.countDocuments({})).toBe(0);
  }, 25000);

  it('rejects a line carrying both a debit and a credit', async () => {
    const ctx = await scaffold();

    const res = await entry(ctx, [
      { accountId: ctx.byCode['1000']._id, debit: 500, credit: 500 },
      { accountId: ctx.byCode['4000']._id, debit: 0, credit: 0 },
    ]);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await JournalEntry.countDocuments({})).toBe(0);
  }, 25000);

  it('will not let a posted entry be edited', async () => {
    const ctx = await scaffold();
    await feeReceipt(ctx);

    const posted = await JournalEntry.findOne({});
    posted.narration = 'Quietly changed after the fact';

    await expect(posted.save()).rejects.toThrow(/cannot be edited/i);
  }, 25000);

  it('reverses a posted entry with a mirror entry and links the two', async () => {
    const ctx = await scaffold();
    await feeReceipt(ctx);
    const original = await JournalEntry.findOne({});

    const res = await request(app)
      .post(`/api/v1/ledger/entries/${original._id}/reverse`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ date: '2026-09-05' });

    expect(res.status).toBe(201);

    const reversal = await JournalEntry.findById(res.body.data._id);
    expect(String(reversal.reversesEntryId)).toBe(String(original._id));
    // Debits and credits swap sides.
    expect(reversal.lines[0].credit).toBe(original.lines[0].debit);
    expect(reversal.lines[1].debit).toBe(original.lines[1].credit);

    const refreshed = await JournalEntry.findById(original._id);
    expect(String(refreshed.reversedByEntryId)).toBe(String(reversal._id));

    // The two together net to nothing, so the books are square again.
    const tb = await request(app)
      .get('/api/v1/ledger/reports/trial-balance')
      .set('Authorization', `Bearer ${ctx.token}`);
    expect(tb.body.data.rows.every((r) => r.balance === 0)).toBe(true);
  }, 25000);

  it('refuses to post into another school ledger account', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();

    const res = await entry(mine, [
      { accountId: theirs.byCode['1000']._id, debit: 5000, credit: 0 },
      { accountId: mine.byCode['4000']._id, debit: 0, credit: 5000 },
    ]);

    expect(res.status).toBe(400);
    expect(await JournalEntry.countDocuments({})).toBe(0);
  }, 25000);
});

describe('statements', () => {
  it('produces a balanced trial balance and the expected surplus', async () => {
    const ctx = await scaffold();

    await feeReceipt(ctx, 50000);                       // Dr Cash / Cr Tuition income
    await entry(ctx, [                                   // Dr Salaries / Cr Cash
      { accountId: ctx.byCode['5000']._id, debit: 30000, credit: 0 },
      { accountId: ctx.byCode['1000']._id, debit: 0, credit: 30000 },
    ]);

    const tb = await request(app)
      .get('/api/v1/ledger/reports/trial-balance')
      .set('Authorization', `Bearer ${ctx.token}`);
    expect(tb.body.data.isBalanced).toBe(true);
    expect(tb.body.data.totalDebit).toBe(80000);

    const pl = await request(app)
      .get('/api/v1/ledger/reports/profit-and-loss')
      .set('Authorization', `Bearer ${ctx.token}`);
    expect(pl.body.data.totalIncome).toBe(50000);
    expect(pl.body.data.totalExpense).toBe(30000);
    expect(pl.body.data.surplus).toBe(20000);

    const bs = await request(app)
      .get('/api/v1/ledger/reports/balance-sheet')
      .set('Authorization', `Bearer ${ctx.token}`);
    // Cash 20,000 on one side; the period surplus of 20,000 on the other.
    expect(bs.body.data.totalAssets).toBe(20000);
    expect(bs.body.data.currentPeriodSurplus).toBe(20000);
    expect(bs.body.data.isBalanced).toBe(true);
  }, 25000);

  it('leaves draft entries out of the statements entirely', async () => {
    const ctx = await scaffold();

    await entry(ctx, [
      { accountId: ctx.byCode['1000']._id, debit: 9999, credit: 0 },
      { accountId: ctx.byCode['4000']._id, debit: 0, credit: 9999 },
    ], { post: false });

    const tb = await request(app)
      .get('/api/v1/ledger/reports/trial-balance')
      .set('Authorization', `Bearer ${ctx.token}`);

    expect(tb.body.data.totalDebit).toBe(0);
    expect(tb.body.data.rows).toHaveLength(0);
  }, 25000);

  it('shows a running balance on the account ledger', async () => {
    const ctx = await scaffold();
    await feeReceipt(ctx, 10000);
    await entry(ctx, [
      { accountId: ctx.byCode['5000']._id, debit: 4000, credit: 0 },
      { accountId: ctx.byCode['1000']._id, debit: 0, credit: 4000 },
    ]);

    const res = await request(app)
      .get(`/api/v1/ledger/accounts/${ctx.byCode['1000']._id}/ledger`)
      .set('Authorization', `Bearer ${ctx.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rows).toHaveLength(2);
    expect(res.body.data.closingBalance).toBe(6000);
  }, 25000);
});
