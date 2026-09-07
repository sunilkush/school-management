import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

/** Only set when this file had to start its own server — see the fallback in connectTestDb. */
let ownReplSet;

/** Connects mongoose to the in-memory MongoDB — never to the real Atlas URI in .env.
 *
 * The server itself is started once for the whole run by tests/setup/globalSetup.js. It is a
 * single-node replica set rather than a standalone: several controllers (refundPayment,
 * payStudentFee, promoteStudentsToNextAcademicYear, ...) use mongoose sessions/transactions for
 * atomic multi-document writes, and MongoDB only allows transactions against a replica set or
 * mongos. A standalone instance fails every such call with "Transaction numbers are only allowed
 * on a replica set member or mongos", silently leaving all transactional code paths untested.
 *
 * Each suite gets its own database on that shared server, so no two suites can read each other's
 * data or trip over each other's setup and teardown.
 */
export async function connectTestDb() {
  let uri = process.env.MONGO_TEST_URI;

  if (!uri) {
    // Only reached if a suite is run through something that skips globalSetup. Starting a server
    // here keeps that working rather than failing with a confusing connection error.
    ownReplSet = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        storageEngine: 'wiredTiger',
        args: ['--setParameter', 'maxTransactionLockRequestTimeoutMillis=5000'],
      },
    });
    uri = ownReplSet.getUri();
  }

  // A fresh database per suite, not per worker.
  //
  // Per-worker was wrong: under --runInBand every suite is the same worker, so all 29 shared one
  // database name. A suite dropping it in afterAll overlapped the next suite creating collections
  // in it, which surfaced as "database is in the process of being dropped" and "Client must be
  // connected", index builds silently failing, and then a random suite failing for reasons that
  // had nothing to do with its own code. Unique names mean no two suites can ever collide.
  await mongoose.connect(uri, { dbName: `test_${process.env.JEST_WORKER_ID || '1'}_${randomUUID().slice(0, 8)}` });

  // Mongoose builds each model's indexes asynchronously in the background by default, so a
  // transaction that's the very first write to a given collection in this freshly-created
  // database can race an in-flight index build and fail with "Unable to write to collection
  // ... due to catalog changes; please retry the operation" — index creation is itself a
  // catalog change MongoDB won't allow concurrently with an open transaction touching the same
  // collection. Model.init() resolves once that model's indexes are actually built, so awaiting
  // every registered model here guarantees no transaction in a test can race one.
  //
  // Swallow individual failures (logged, not thrown): this surfaced a pre-existing, unrelated
  // index definition conflict on at least one model (two schemas independently declaring an
  // `expiresAt_1` index with different TTL options) that autoIndex previously built lazily in
  // the background, where a failure never got the chance to block anything. That's a real bug
  // worth fixing separately, but one bad model's index build must not stop every other model's
  // indexes — and this whole test suite — from being ready.
  const results = await Promise.allSettled(mongoose.modelNames().map((name) => mongoose.model(name).init()));
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(`[testDb] Index build failed for model "${mongoose.modelNames()[i]}": ${result.reason?.message || result.reason}`);
    }
  });
}

/** Drops this suite's database and disconnects. The shared server keeps running for the rest of
 *  the run and is stopped by globalTeardown. */
export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (ownReplSet) {
    await ownReplSet.stop();
    ownReplSet = undefined;
  }
}

/** Clears all collections between tests so each test starts from a clean slate. */
export async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}
