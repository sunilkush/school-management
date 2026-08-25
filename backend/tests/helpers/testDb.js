import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongod;

/** Starts an in-memory MongoDB and connects mongoose to it — never touches the real Atlas URI in .env.
 * A single-node replica set, not a standalone server — several controllers (refundPayment,
 * payStudentFee, promoteStudentsToNextAcademicYear, ...) use mongoose sessions/transactions for
 * atomic multi-document writes, and MongoDB only allows transactions against a replica set or
 * mongos. A standalone instance fails every such call with "Transaction numbers are only
 * allowed on a replica set member or mongos", silently leaving all transactional code paths
 * completely untested. */
export async function connectTestDb() {
  mongod = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
      // MongoDB's default 5ms transaction lock-wait timeout is tuned for a busy production
      // deployment to fail fast under real contention — against a single-node test replica set
      // it trips on totally ordinary sequential test traffic (e.g. two tests in a row each
      // starting a transaction), throwing "Unable to acquire IX lock ... within 5ms" for no
      // application-level reason. 5s gives transactions actual room to run in tests.
      args: ['--setParameter', 'maxTransactionLockRequestTimeoutMillis=5000'],
    },
  });
  await mongoose.connect(mongod.getUri());

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

export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

/** Clears all collections between tests so each test starts from a clean slate. */
export async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}
